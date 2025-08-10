/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { readdir, stat } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import { BaseTool } from '../BaseTool.js';
import type { ToolExecutionContext, ToolResult } from '../../types/index.js';

/**
 * Glob Tool for file pattern matching and discovery
 * 
 * Provides powerful file pattern matching capabilities with:
 * - Standard glob patterns (*, **, ?, [])
 * - Recursive directory traversal
 * - File type filtering
 * - Size and date filtering
 * - Sorting and limiting options
 */
export class GlobTool extends BaseTool<typeof GlobToolSchema> {
  constructor() {
    super('glob', DESCRIPTION, GlobToolSchema);
  }

  protected async executeImpl(
    params: z.infer<typeof GlobToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const workingDir = process.cwd();
    const searchPath = params.path ? 
      this.validateFilePath(params.path, workingDir) : 
      workingDir;

    // Find all matching files
    const matches = await this.findMatches(searchPath, params, context);
    
    // Sort matches
    this.sortMatches(matches, params.sortBy || 'path');
    
    // Apply limit if specified
    const limitedMatches = params.limit ? matches.slice(0, params.limit) : matches;
    
    // Format output
    const output = this.formatMatches(limitedMatches, params);
    
    return {
      title: `Glob pattern: ${params.pattern}`,
      output,
      metadata: {
        pattern: params.pattern,
        searchPath,
        totalMatches: matches.length,
        shownMatches: limitedMatches.length,
        directories: matches.filter(m => m.isDirectory).length,
        files: matches.filter(m => !m.isDirectory).length
      }
    };
  }

  protected generateDefaultTitle(params: z.infer<typeof GlobToolSchema>): string {
    const pathDesc = params.path ? ` in ${params.path}` : '';
    return `Find "${params.pattern}"${pathDesc}`;
  }

  private async findMatches(
    searchPath: string,
    params: z.infer<typeof GlobToolSchema>,
    context: ToolExecutionContext
  ): Promise<GlobMatch[]> {
    const matches: GlobMatch[] = [];
    const visited = new Set<string>();
    
    await this.traverseDirectory(
      searchPath,
      params.pattern,
      matches,
      visited,
      params,
      context,
      0
    );
    
    return matches;
  }

  private async traverseDirectory(
    dirPath: string,
    pattern: string,
    matches: GlobMatch[],
    visited: Set<string>,
    params: z.infer<typeof GlobToolSchema>,
    context: ToolExecutionContext,
    depth: number
  ): Promise<void> {
    // Check for abort
    if (context.abort.aborted) {
      return;
    }
    
    // Prevent infinite loops with symlinks
    if (visited.has(dirPath)) {
      return;
    }
    visited.add(dirPath);
    
    // Check depth limit
    const maxDepth = params.maxDepth ?? 10;
    if (depth > maxDepth) {
      return;
    }

    try {
      const entries = await readdir(dirPath);
      
      for (const entry of entries) {
        if (context.abort.aborted) {
          return;
        }
        
        const entryPath = join(dirPath, entry);
        
        // Skip hidden files unless requested
        if (!params.includeHidden && entry.startsWith('.')) {
          continue;
        }
        
        try {
          const stats = await stat(entryPath);
          
          // Check if this entry matches the pattern
          const relativePath = relative(params.path || process.cwd(), entryPath);
          if (this.matchesPattern(relativePath, pattern)) {
            // Apply additional filters
            if (await this.passesFilters(entryPath, stats, params)) {
              matches.push({
                path: entryPath,
                relativePath,
                name: entry,
                size: stats.size,
                modified: stats.mtime || new Date(),
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                extension: extname(entry).toLowerCase()
              });
            }
          }
          
          // Recurse into directories
          if (stats.isDirectory()) {
            await this.traverseDirectory(
              entryPath,
              pattern,
              matches,
              visited,
              params,
              context,
              depth + 1
            );
          }
        } catch (error) {
          // Skip entries we can't access
          continue;
        }
      }
    } catch (error) {
      // Skip directories we can't read
      return;
    }
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex = this.globToRegex(pattern);
    return regex.test(path);
  }

  private globToRegex(pattern: string): RegExp {
    // Escape special regex characters except glob characters
    let regexPattern = pattern
      .replace(/[.+^${}|()[\]\\]/g, '\\$&') // Escape regex specials
      .replace(/\*/g, '.*')                  // * matches any characters
      .replace(/\?/g, '.')                   // ? matches single character
      .replace(/\.\*\.\*/g, '.*');           // Simplify .*.*  to .*
    
    // Handle ** for recursive directory matching
    regexPattern = regexPattern.replace(/\/\.\*\.\*/g, '(/.*)?');
    
    // Handle character classes [abc]
    regexPattern = regexPattern.replace(/\\\[([^\]]*)\\\]/g, '[$1]');
    
    // Anchor the pattern
    regexPattern = `^${regexPattern}$`;
    
    return new RegExp(regexPattern, 'i');
  }

  private async passesFilters(
    filePath: string,
    stats: Stats,
    params: z.infer<typeof GlobToolSchema>
  ): Promise<boolean> {
    // File type filter
    if (params.fileType) {
      if (params.fileType === 'file' && !stats.isFile()) return false;
      if (params.fileType === 'directory' && !stats.isDirectory()) return false;
    }
    
    // Size filters
    if (params.minSize !== undefined && stats.size < params.minSize) {
      return false;
    }
    if (params.maxSize !== undefined && stats.size > params.maxSize) {
      return false;
    }
    
    // Modified date filters
    const modTime = stats.mtime?.getTime() || 0;
    
    if (params.modifiedAfter) {
      const afterTime = new Date(params.modifiedAfter).getTime();
      if (modTime < afterTime) return false;
    }
    
    if (params.modifiedBefore) {
      const beforeTime = new Date(params.modifiedBefore).getTime();
      if (modTime > beforeTime) return false;
    }
    
    // Extension filter
    if (params.extensions) {
      const ext = extname(filePath).toLowerCase().substring(1); // Remove the dot
      if (!params.extensions.includes(ext)) return false;
    }
    
    return true;
  }

  private sortMatches(matches: GlobMatch[], sortBy: string): void {
    matches.sort((a, b) => {
      // Always put directories first within each sort category
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      switch (sortBy) {
        case 'size':
          return b.size - a.size;
        case 'modified':
          return b.modified.getTime() - a.modified.getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'extension':
          return a.extension.localeCompare(b.extension);
        case 'path':
        default:
          return a.relativePath.localeCompare(b.relativePath);
      }
    });
  }

  private formatMatches(matches: GlobMatch[], params: z.infer<typeof GlobToolSchema>): string {
    if (matches.length === 0) {
      return `No files match the pattern: ${params.pattern}`;
    }
    
    let output = `Found ${matches.length} matches:\n\n`;
    
    if (params.detailed) {
      // Detailed format with sizes and dates
      const maxPathLength = Math.max(...matches.map(m => m.relativePath.length));
      
      for (const match of matches) {
        const path = match.relativePath.padEnd(maxPathLength);
        const size = match.isDirectory ? '<DIR>' : this.formatFileSize(match.size);
        const modified = match.modified.toISOString().split('T')[0];
        const type = match.isDirectory ? 'dir' : 'file';
        
        output += `${path}  ${size.padStart(10)}  ${modified}  ${type}`;
        if (match.extension && !match.isDirectory) {
          output += `  ${match.extension}`;
        }
        output += '\n';
      }
    } else {
      // Simple format - just paths
      for (const match of matches) {
        if (match.isDirectory) {
          output += `${match.relativePath}/\n`;
        } else {
          output += `${match.relativePath}\n`;
        }
      }
    }
    
    const dirCount = matches.filter(m => m.isDirectory).length;
    const fileCount = matches.filter(m => !m.isDirectory).length;
    output += `\n${dirCount} directories, ${fileCount} files`;
    
    return output;
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  }
}

interface GlobMatch {
  path: string;
  relativePath: string;
  name: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
}

// For compatibility with fs.Stats
interface Stats {
  size: number;
  mtime?: Date;
  isFile(): boolean;
  isDirectory(): boolean;
}

const DESCRIPTION = `
Find files and directories using glob patterns with advanced filtering options.

This tool provides powerful file discovery capabilities using standard glob patterns:

Glob Pattern Syntax:
- '*' matches any characters (except path separators)
- '**' matches any characters including path separators (recursive)
- '?' matches any single character
- '[abc]' matches any character in brackets
- '[a-z]' matches any character in range
- '**/*.js' finds all JavaScript files recursively

Filtering Options:
- File type filtering (files only, directories only)
- Size filtering (minimum/maximum file size)
- Date filtering (modified before/after)
- Extension filtering (specific file extensions)
- Hidden file inclusion/exclusion

Output Options:
- Simple format (just paths) or detailed format (with sizes, dates)
- Multiple sorting options (path, name, size, modified, extension)
- Result limiting for large matches
- Directory depth limiting

Examples:
- "*.js" - all JavaScript files in current directory
- "**/*.py" - all Python files recursively
- "src/**/*.ts" - all TypeScript files under src/
- "test*.txt" - all text files starting with 'test'
- "**/README.md" - all README.md files recursively

The tool provides comprehensive file discovery with flexible filtering
and formatting options.
`.trim();

const GlobToolSchema = z.object({
  pattern: z.string().describe('The glob pattern to match (supports *, **, ?, [abc])'),
  path: z.string().optional().describe('Directory to search in (default: current directory)'),
  fileType: z.enum(['file', 'directory']).optional().describe('Filter by type: files only or directories only'),
  includeHidden: z.boolean().optional().default(false).describe('Include hidden files (starting with .)'),
  detailed: z.boolean().optional().default(false).describe('Show detailed information (size, date, type)'),
  sortBy: z.enum(['path', 'name', 'size', 'modified', 'extension']).optional().default('path').describe('Sort results by specified criteria'),
  limit: z.number().int().min(1).optional().describe('Maximum number of results to return'),
  maxDepth: z.number().int().min(0).optional().default(10).describe('Maximum directory depth to traverse'),
  minSize: z.number().int().min(0).optional().describe('Minimum file size in bytes'),
  maxSize: z.number().int().min(0).optional().describe('Maximum file size in bytes'),
  modifiedAfter: z.string().optional().describe('Only files modified after this date (ISO format)'),
  modifiedBefore: z.string().optional().describe('Only files modified before this date (ISO format)'),
  extensions: z.array(z.string()).optional().describe('Filter by file extensions (without dots, e.g., ["js", "ts"])')
});

// Export the tool instance
// export const GlobTool = new GlobTool();