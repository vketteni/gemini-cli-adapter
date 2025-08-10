/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { readFile, stat } from 'fs/promises';
import { existsSync, readdirSync, Stats } from 'fs';
import { join, isAbsolute, dirname, basename, relative, extname } from 'path';
import { BaseTool, ToolSecurityError } from '../BaseTool.js';
import type { ToolExecutionContext, ToolResult } from '../../types/index.js';

/**
 * Read Tool with smart file reading and suggestions
 * 
 * Provides sophisticated file reading with features like:
 * - Binary file detection
 * - Image file detection  
 * - Smart file suggestions on not found
 * - Line-based reading with offsets and limits
 * - Content truncation for very long lines
 */
export class ReadTool extends BaseTool<typeof ReadToolSchema> {
  private static readonly DEFAULT_READ_LIMIT = 2000;
  private static readonly MAX_LINE_LENGTH = 2000;

  constructor() {
    super('read', DESCRIPTION, ReadToolSchema);
  }

  protected async executeImpl(
    params: z.infer<typeof ReadToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const workingDir = process.cwd();
    const absolutePath = this.validateFilePath(params.filePath, workingDir);
    
    // Check if file exists
    if (!existsSync(absolutePath)) {
      throw new Error(await this.generateFileNotFoundError(absolutePath));
    }

    let fileStats: Stats;
    try {
      fileStats = await stat(absolutePath);
    } catch (error) {
      throw new Error(`Cannot access file ${absolutePath}: ${(error as Error).message}`);
    }

    if (fileStats.isDirectory()) {
      throw new Error(`Path is a directory, not a file: ${absolutePath}. Use the ls tool to list directory contents.`);
    }

    // Check for binary files
    if (await this.isBinaryFile(absolutePath)) {
      throw new Error(`Cannot read binary file: ${absolutePath}`);
    }

    // Check for image files
    const imageType = this.getImageType(absolutePath);
    if (imageType) {
      throw new Error(`This is an image file of type: ${imageType}\nUse a different tool to process images`);
    }

    // Read and format the file content
    return await this.readAndFormatFile(absolutePath, params);
  }

  protected generateDefaultTitle(params: z.infer<typeof ReadToolSchema>): string {
    const workingDir = process.cwd();
    const relativePath = relative(workingDir, params.filePath);
    return `Read ${relativePath}`;
  }

  private async readAndFormatFile(
    filePath: string,
    params: z.infer<typeof ReadToolSchema>
  ): Promise<ToolResult> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      const limit = params.limit ?? ReadTool.DEFAULT_READ_LIMIT;
      const offset = params.offset ?? 0;
      
      // Validate offset
      if (offset < 0) {
        throw new Error('Offset cannot be negative');
      }
      
      if (offset >= lines.length) {
        throw new Error(`Offset ${offset} exceeds file length (${lines.length} lines)`);
      }

      // Extract the requested range
      const requestedLines = lines.slice(offset, offset + limit);
      
      // Truncate very long lines
      const truncatedLines = requestedLines.map((line) => {
        if (line.length > ReadTool.MAX_LINE_LENGTH) {
          return line.substring(0, ReadTool.MAX_LINE_LENGTH) + '...';
        }
        return line;
      });

      // Format with line numbers (1-based)
      const formattedContent = truncatedLines.map((line, index) => {
        const lineNumber = offset + index + 1;
        return `${lineNumber.toString().padStart(5, ' ')}→${line}`;
      }).join('\n');

      const relativePath = relative(process.cwd(), filePath);
      
      let output = `<file>\n${formattedContent}\n</file>`;
      
      // Add continuation notice if there are more lines
      if (lines.length > offset + truncatedLines.length) {
        const remainingLines = lines.length - (offset + truncatedLines.length);
        output += `\n\n(File has ${remainingLines} more lines. Use 'offset: ${offset + truncatedLines.length}' parameter to read beyond line ${offset + truncatedLines.length})`;
      }

      // Generate preview (first 20 lines for metadata)
      const preview = requestedLines.slice(0, 20).join('\n');

      return {
        title: relativePath,
        output,
        metadata: {
          filePath,
          totalLines: lines.length,
          linesRead: truncatedLines.length,
          offset,
          limit,
          fileSize: content.length,
          preview,
          hasMoreContent: lines.length > offset + truncatedLines.length
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  private async generateFileNotFoundError(filePath: string): Promise<string> {
    const dir = dirname(filePath);
    const base = basename(filePath);
    
    let errorMessage = `File not found: ${filePath}`;
    
    try {
      // Try to provide helpful suggestions
      if (existsSync(dir)) {
        const dirEntries = readdirSync(dir);
        const suggestions = dirEntries
          .filter((entry) => {
            const entryLower = entry.toLowerCase();
            const baseLower = base.toLowerCase();
            return entryLower.includes(baseLower) || baseLower.includes(entryLower);
          })
          .map((entry) => join(dir, entry))
          .slice(0, 3);

        if (suggestions.length > 0) {
          errorMessage += '\n\nDid you mean one of these?\n' + suggestions.join('\n');
        }
      }
    } catch {
      // Ignore errors in suggestion generation
    }

    return errorMessage;
  }

  private async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      // Read first 512 bytes to check for null bytes
      const buffer = await readFile(filePath, { flag: 'r' });
      const checkBytes = buffer.slice(0, 512);
      
      for (let i = 0; i < checkBytes.length; i++) {
        if (checkBytes[i] === 0) {
          return true; // Null byte indicates binary
        }
      }
      
      return false;
    } catch {
      return false; // If we can't read it, assume it's not binary
    }
  }

  private getImageType(filePath: string): string | null {
    const ext = extname(filePath).toLowerCase();
    
    const imageTypes: Record<string, string> = {
      '.jpg': 'JPEG',
      '.jpeg': 'JPEG',
      '.png': 'PNG',
      '.gif': 'GIF',
      '.bmp': 'BMP',
      '.svg': 'SVG',
      '.webp': 'WebP',
      '.ico': 'ICO',
      '.tiff': 'TIFF',
      '.tif': 'TIFF'
    };
    
    return imageTypes[ext] || null;
  }
}

const DESCRIPTION = `
Read file contents with smart formatting and line-based navigation.

Features:
- Automatic binary file detection and rejection
- Image file type detection
- Smart file suggestions when file not found
- Line-based reading with customizable offset and limit
- Automatic line truncation for very long lines
- Line number formatting for easy reference

Parameters:
- filePath: Path to the file to read (absolute or relative)
- offset: Starting line number (0-based, optional)
- limit: Maximum number of lines to read (default: 2000)

The tool formats output with line numbers for easy reference and provides
continuation information when files exceed the read limit.

Security features:
- Path validation and containment checking
- Binary file protection
- Working directory restrictions
`.trim();

const ReadToolSchema = z.object({
  filePath: z.string().describe('The path to the file to read (absolute or relative)'),
  offset: z.number().int().min(0).optional().describe('The line number to start reading from (0-based, default: 0)'),
  limit: z.number().int().min(1).optional().describe('The maximum number of lines to read (default: 2000)')
});

// Export the tool instance
// export const ReadTool = new ReadTool();