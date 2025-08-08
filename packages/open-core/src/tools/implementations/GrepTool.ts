/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import { relative } from 'path';
import { BaseTool } from '../BaseTool.js';
import type { ToolExecutionContext, ToolResult } from '../../types/index.js';

/**
 * Grep Tool with ripgrep integration for powerful text searching
 * 
 * Provides advanced search capabilities with:
 * - Ripgrep integration for fast searching
 * - Regex pattern support
 * - File filtering and globbing
 * - Context lines around matches
 * - JSON output parsing for structured results
 */
export class GrepTool extends BaseTool<typeof GrepToolSchema> {
  constructor() {
    super('grep', DESCRIPTION, GrepToolSchema);
  }

  protected async executeImpl(
    params: z.infer<typeof GrepToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const workingDir = process.cwd();
    const searchPath = params.path ? 
      this.validateFilePath(params.path, workingDir) : 
      workingDir;

    // Validate search path exists
    if (!existsSync(searchPath)) {
      throw new Error(`Search path does not exist: ${searchPath}`);
    }

    // Check if ripgrep is available, fallback to basic search if not
    const useRipgrep = await this.checkRipgrepAvailability();
    
    if (useRipgrep) {
      return await this.searchWithRipgrep(searchPath, params, context);
    } else {
      return await this.searchWithBuiltIn(searchPath, params, context);
    }
  }

  protected generateDefaultTitle(params: z.infer<typeof GrepToolSchema>): string {
    const pathDesc = params.path ? ` in ${params.path}` : ' in current directory';
    return `Search "${params.pattern}"${pathDesc}`;
  }

  private async checkRipgrepAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('rg', ['--version'], { stdio: 'ignore' });
      child.on('close', (code) => {
        resolve(code === 0);
      });
      child.on('error', () => {
        resolve(false);
      });
    });
  }

  private async searchWithRipgrep(
    searchPath: string,
    params: z.infer<typeof GrepToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const args = ['--json'];
    
    // Add search options
    if (!params.caseSensitive) {
      args.push('-i');
    }
    
    if (params.wholeWords) {
      args.push('-w');
    }
    
    if (params.contextLines && params.contextLines > 0) {
      args.push('-C', params.contextLines.toString());
    }
    
    if (params.filePattern) {
      args.push('-g', params.filePattern);
    }
    
    if (params.excludePattern) {
      args.push('-g', `!${params.excludePattern}`);
    }
    
    // Add pattern and path
    args.push(params.pattern, searchPath);
    
    const result = await this.executeRipgrep(args, context.abort);
    return this.formatRipgrepResults(result, params);
  }

  private async executeRipgrep(args: string[], abortSignal: AbortSignal): Promise<RipgrepResult[]> {
    return new Promise((resolve, reject) => {
      const child = spawn('rg', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        signal: abortSignal
      });

      const results: RipgrepResult[] = [];
      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0 || code === 1) { // 1 means no matches found
          // Parse JSON output
          const lines = stdout.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              try {
                const result = JSON.parse(line);
                results.push(result);
              } catch (error) {
                // Skip invalid JSON lines
              }
            }
          }
          resolve(results);
        } else {
          reject(new Error(`Ripgrep failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute ripgrep: ${error.message}`));
      });
    });
  }

  private formatRipgrepResults(results: RipgrepResult[], params: z.infer<typeof GrepToolSchema>): ToolResult {
    let output = '';
    let matchCount = 0;
    const fileMatches: Record<string, number> = {};
    
    for (const result of results) {
      if (result.type === 'match') {
        const filePath = relative(process.cwd(), result.data.path.text);
        const lineNum = result.data.line_number;
        const content = result.data.lines.text.trimEnd();
        
        // Track matches per file
        fileMatches[filePath] = (fileMatches[filePath] || 0) + 1;
        matchCount++;
        
        // Format the match
        if (params.showFileNames !== false) {
          output += `${filePath}:${lineNum}: ${content}\n`;
        } else {
          output += `${lineNum}: ${content}\n`;
        }
        
        // Add context if available
        if (result.data.submatches) {
          for (const submatch of result.data.submatches) {
            // Highlight the match (simplified)
            // In a real implementation, you'd use proper highlighting
          }
        }
      } else if (result.type === 'context') {
        // Context lines
        const filePath = relative(process.cwd(), result.data.path.text);
        const lineNum = result.data.line_number;
        const content = result.data.lines.text.trimEnd();
        
        if (params.showFileNames !== false) {
          output += `${filePath}-${lineNum}- ${content}\n`;
        } else {
          output += `${lineNum}- ${content}\n`;
        }
      }
    }

    if (matchCount === 0) {
      output = `No matches found for pattern: ${params.pattern}`;
    } else {
      const fileCount = Object.keys(fileMatches).length;
      const summary = `Found ${matchCount} matches in ${fileCount} file(s)\n\n`;
      output = summary + output;
    }

    return {
      title: `Search results for "${params.pattern}"`,
      output,
      metadata: {
        pattern: params.pattern,
        matchCount,
        fileCount: Object.keys(fileMatches).length,
        fileMatches,
        searchPath: params.path,
        tool: 'ripgrep'
      }
    };
  }

  private async searchWithBuiltIn(
    searchPath: string,
    params: z.infer<typeof GrepToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    // Fallback implementation using built-in Node.js capabilities
    // This is a simplified version - real implementation would be more sophisticated
    const { readFile, readdir } = await import('fs/promises');
    const { join } = await import('path');
    
    const matches: SearchMatch[] = [];
    
    if (statSync(searchPath).isFile()) {
      // Search single file
      const content = await readFile(searchPath, 'utf-8');
      const fileMatches = this.searchInContent(content, params.pattern, searchPath, params);
      matches.push(...fileMatches);
    } else {
      // Search directory (simplified - no recursion)
      const entries = await readdir(searchPath);
      
      for (const entry of entries) {
        const entryPath = join(searchPath, entry);
        
        if (context.abort.aborted) {
          throw new Error('Search was aborted');
        }
        
        try {
          const stats = statSync(entryPath);
          if (stats.isFile()) {
            // Apply file pattern filtering
            if (params.filePattern && !this.matchesGlob(entry, params.filePattern)) {
              continue;
            }
            if (params.excludePattern && this.matchesGlob(entry, params.excludePattern)) {
              continue;
            }
            
            const content = await readFile(entryPath, 'utf-8');
            const fileMatches = this.searchInContent(content, params.pattern, entryPath, params);
            matches.push(...fileMatches);
          }
        } catch (error) {
          // Skip files we can't read
          continue;
        }
      }
    }

    return this.formatBuiltInResults(matches, params);
  }

  private searchInContent(
    content: string,
    pattern: string,
    filePath: string,
    params: z.infer<typeof GrepToolSchema>
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');
    
    // Create regex
    const flags = params.caseSensitive ? 'g' : 'gi';
    const regexPattern = params.wholeWords ? `\\b${pattern}\\b` : pattern;
    const regex = new RegExp(regexPattern, flags);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (regex.test(line)) {
        matches.push({
          filePath,
          lineNumber: i + 1,
          content: line,
          matchIndex: i
        });
      }
    }
    
    return matches;
  }

  private matchesGlob(filename: string, pattern: string): boolean {
    // Simple glob matching - in practice, you'd use a proper glob library
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filename);
  }

  private formatBuiltInResults(matches: SearchMatch[], params: z.infer<typeof GrepToolSchema>): ToolResult {
    let output = '';
    const fileMatches: Record<string, number> = {};
    
    if (matches.length === 0) {
      output = `No matches found for pattern: ${params.pattern}`;
    } else {
      for (const match of matches) {
        const relativePath = relative(process.cwd(), match.filePath);
        fileMatches[relativePath] = (fileMatches[relativePath] || 0) + 1;
        
        if (params.showFileNames !== false) {
          output += `${relativePath}:${match.lineNumber}: ${match.content}\n`;
        } else {
          output += `${match.lineNumber}: ${match.content}\n`;
        }
      }
      
      const fileCount = Object.keys(fileMatches).length;
      const summary = `Found ${matches.length} matches in ${fileCount} file(s)\n\n`;
      output = summary + output;
    }

    return {
      title: `Search results for "${params.pattern}"`,
      output,
      metadata: {
        pattern: params.pattern,
        matchCount: matches.length,
        fileCount: Object.keys(fileMatches).length,
        fileMatches,
        searchPath: params.path,
        tool: 'builtin'
      }
    };
  }
}

interface RipgrepResult {
  type: 'match' | 'context' | 'begin' | 'end';
  data: {
    path: { text: string };
    line_number: number;
    lines: { text: string };
    submatches?: Array<{
      match: { text: string };
      start: number;
      end: number;
    }>;
  };
}

interface SearchMatch {
  filePath: string;
  lineNumber: number;
  content: string;
  matchIndex: number;
}

const DESCRIPTION = `
Search for text patterns in files using powerful regex capabilities.

This tool provides comprehensive text searching with the following features:

Search Capabilities:
- Regular expression pattern matching
- Case-sensitive and case-insensitive search
- Whole word matching
- Context lines around matches
- File and directory searching

Performance Features:
- Ripgrep integration for fast searching (falls back to built-in if unavailable)
- JSON output parsing for structured results
- Efficient handling of large codebases
- Abortable operations

Filtering Options:
- File pattern matching (glob patterns like '*.js', '*.py')
- Exclude pattern matching to skip unwanted files
- Directory and single file search modes

Output Features:
- File names and line numbers for each match
- Configurable context lines around matches
- Match count and file statistics
- Clean, organized result formatting

The tool automatically detects ripgrep availability and falls back to a
built-in search implementation if needed.
`.trim();

const GrepToolSchema = z.object({
  pattern: z.string().describe('The regular expression pattern to search for'),
  path: z.string().optional().describe('File or directory path to search in (default: current directory)'),
  caseSensitive: z.boolean().optional().default(false).describe('Perform case-sensitive search'),
  wholeWords: z.boolean().optional().default(false).describe('Match whole words only'),
  contextLines: z.number().int().min(0).max(10).optional().describe('Number of context lines to show around matches'),
  filePattern: z.string().optional().describe('File pattern to include (e.g., \'*.js\', \'*.py\')'),
  excludePattern: z.string().optional().describe('File pattern to exclude'),
  showFileNames: z.boolean().optional().default(true).describe('Show file names in output')
});

// Export the tool instance
export const GrepTool = new GrepTool();