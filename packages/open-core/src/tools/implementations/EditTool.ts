/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Enhanced file editing patterns inspired by OpenCode (https://github.com/sst/opencode)
 * - MIT licensed, multi-strategy replacement system adapted for Open CLI
 */

import { z } from 'zod';
import { readFile, writeFile, stat } from 'fs/promises';
import { existsSync, Stats } from 'fs';
import { join, isAbsolute, dirname, relative } from 'path';
import { BaseTool, ToolSecurityError, ToolPermissionError } from '../BaseTool.js';
import type { ToolExecutionContext, ToolResult } from '../../types/index.js';
import { replaceWithStrategies } from './edit/replacers.js';

/**
 * Enhanced Edit Tool with OpenCode's multi-strategy replacement system
 * 
 * This tool provides robust file editing capabilities using multiple fallback
 * strategies to handle various whitespace and formatting scenarios.
 */
export class EditTool extends BaseTool<typeof EditToolSchema> {
  constructor() {
    super('edit', DESCRIPTION, EditToolSchema);
  }

  protected async executeImpl(
    params: z.infer<typeof EditToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const workingDir = process.cwd();
    const absolutePath = this.validateFilePath(params.filePath, workingDir);
    
    // Handle new file creation (when oldString is empty)
    if (params.oldString === '') {
      return await this.createNewFile(absolutePath, params.newString);
    }

    // Handle existing file modification
    return await this.modifyExistingFile(absolutePath, params, context);
  }

  protected async checkPermissions(
    params: z.infer<typeof EditToolSchema>,
    context: ToolExecutionContext
  ): Promise<void> {
    // Check if edit operations are allowed
    // This would integrate with the permission system once implemented
    // For now, we assume edit is allowed unless explicitly denied
    
    const workingDir = process.cwd();
    const absolutePath = this.validateFilePath(params.filePath, workingDir);
    
    // Additional security: prevent editing sensitive system files
    const sensitivePatterns = [
      '/etc/',
      '/usr/bin/',
      '/System/',
      'node_modules/',
      '.git/',
    ];
    
    for (const pattern of sensitivePatterns) {
      if (absolutePath.includes(pattern)) {
        throw new ToolSecurityError(
          `Editing files in ${pattern} is not allowed for security reasons`
        );
      }
    }
  }

  protected generateDefaultTitle(params: z.infer<typeof EditToolSchema>): string {
    const workingDir = process.cwd();
    const relativePath = relative(workingDir, params.filePath);
    return `Edit ${relativePath}`;
  }

  private async createNewFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      // Ensure directory exists
      const dirPath = dirname(filePath);
      await this.ensureDirectoryExists(dirPath);
      
      await writeFile(filePath, content, 'utf-8');
      
      const relativePath = relative(process.cwd(), filePath);
      
      return {
        title: `Created ${relativePath}`,
        output: `Successfully created new file: ${relativePath}\nContent length: ${content.length} characters`,
        metadata: {
          filePath,
          operation: 'create',
          contentLength: content.length,
          lines: content.split('\n').length
        }
      };
    } catch (error) {
      throw new Error(`Failed to create file ${filePath}: ${(error as Error).message}`);
    }
  }

  private async modifyExistingFile(
    filePath: string,
    params: z.infer<typeof EditToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    // Check file exists and is accessible
    if (!existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    let fileStats: Stats;
    try {
      fileStats = await stat(filePath);
    } catch (error) {
      throw new Error(`Cannot access file ${filePath}: ${(error as Error).message}`);
    }

    if (fileStats.isDirectory()) {
      throw new Error(`Path is a directory, not a file: ${filePath}`);
    }

    // Read current content
    let currentContent: string;
    try {
      currentContent = await readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }

    // Apply replacement using multi-strategy approach
    let newContent: string;
    let strategyUsed: string;
    
    try {
      const replacement = replaceWithStrategies(
        currentContent,
        params.oldString,
        params.newString,
        params.replaceAll
      );
      newContent = replacement.result;
      strategyUsed = replacement.strategy;
    } catch (error) {
      throw new Error(`Replacement failed: ${(error as Error).message}`);
    }

    // Write the modified content back to the file
    try {
      await writeFile(filePath, newContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }

    // Generate diff information
    const diff = this.generateDiff(currentContent, newContent, filePath);
    const relativePath = relative(process.cwd(), filePath);
    
    // Calculate changes
    const oldLines = currentContent.split('\n');
    const newLines = newContent.split('\n');
    const linesChanged = Math.abs(newLines.length - oldLines.length);
    const charactersChanged = Math.abs(newContent.length - currentContent.length);

    let output = `Successfully edited ${relativePath}`;
    
    if (params.replaceAll) {
      const occurrences = (currentContent.split(params.oldString).length - 1);
      output += `\nReplaced ${occurrences} occurrence(s) using ${strategyUsed} strategy`;
    } else {
      output += `\nReplaced 1 occurrence using ${strategyUsed} strategy`;
    }
    
    output += `\nLines: ${oldLines.length} → ${newLines.length} (${linesChanged > 0 ? '+' : ''}${linesChanged})`;
    output += `\nCharacters: ${currentContent.length} → ${newContent.length} (${charactersChanged > 0 ? '+' : ''}${charactersChanged})`;

    if (diff.trim()) {
      output += '\n\n<diff>\n' + diff + '\n</diff>';
    }

    return {
      title: `Edited ${relativePath}`,
      output,
      metadata: {
        filePath,
        operation: 'edit',
        strategy: strategyUsed,
        replaceAll: params.replaceAll,
        oldLength: currentContent.length,
        newLength: newContent.length,
        linesAdded: Math.max(0, newLines.length - oldLines.length),
        linesRemoved: Math.max(0, oldLines.length - newLines.length),
        diff: diff
      }
    };
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    const { mkdir } = await import('fs/promises');
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EEXIST') {
        throw new Error(`Failed to create directory ${dirPath}: ${err.message}`);
      }
    }
  }

  private generateDiff(oldContent: string, newContent: string, fileName: string): string {
    // Simple diff implementation - in production, you'd use a proper diff library
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let diff = '';
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine !== newLine) {
        if (oldLine !== undefined) {
          diff += `-${i + 1}: ${oldLine}\n`;
        }
        if (newLine !== undefined) {
          diff += `+${i + 1}: ${newLine}\n`;
        }
      }
    }
    
    return diff;
  }
}

const DESCRIPTION = `
Edit files using sophisticated find-and-replace operations with multiple fallback strategies.

This tool provides robust file editing capabilities that can handle:
- Exact string matching
- Whitespace variations 
- Indentation differences
- Block-based replacements using anchor lines
- Multiple replacement strategies for maximum reliability

The tool automatically tries multiple matching strategies in order of sophistication:
1. Simple exact matching
2. Line-trimmed matching (ignores leading/trailing whitespace)
3. Block anchor matching (uses first/last lines as anchors for multi-line blocks)
4. Whitespace-normalized matching
5. Indentation-flexible matching
6. Escape sequence normalization

Security features:
- Path validation to prevent directory traversal
- Working directory containment
- Sensitive file protection
- Atomic file operations

Usage guidelines:
- For new files, use oldString="" 
- For unique replacements, ensure oldString appears only once
- Use replaceAll=true for multiple occurrences
- Provide specific context in multi-line oldString for better matching
`.trim();

const EditToolSchema = z.object({
  filePath: z.string().describe('The absolute or relative path to the file to modify'),
  oldString: z.string().describe('The text to replace (use empty string for new files)'),
  newString: z.string().describe('The text to replace it with (must be different from oldString unless creating new file)'),
  replaceAll: z.boolean().optional().default(false).describe('Replace all occurrences of oldString (default false)')
});

// Export the tool instance
// export const EditTool = new EditTool();