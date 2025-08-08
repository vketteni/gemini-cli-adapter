/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { writeFile, stat, Stats } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, relative } from 'path';
import { BaseTool, ToolSecurityError } from '../BaseTool.js';
import type { ToolExecutionContext, ToolResult } from '../../types/index.js';

/**
 * Write Tool for creating or completely overwriting files
 * 
 * This tool provides secure file writing capabilities with:
 * - Path validation and security checks
 * - Directory creation if needed
 * - Backup creation for existing files (optional)
 * - Content validation
 */
export class WriteTool extends BaseTool<typeof WriteToolSchema> {
  constructor() {
    super('write', DESCRIPTION, WriteToolSchema);
  }

  protected async executeImpl(
    params: z.infer<typeof WriteToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const workingDir = process.cwd();
    const absolutePath = this.validateFilePath(params.filePath, workingDir);
    
    // Check if we're overwriting an existing file
    const isOverwrite = existsSync(absolutePath);
    
    if (isOverwrite) {
      // Verify it's not a directory
      const fileStats = await stat(absolutePath);
      if (fileStats.isDirectory()) {
        throw new Error(`Cannot write to ${absolutePath}: path is a directory`);
      }
      
      // Create backup if requested
      if (params.createBackup) {
        await this.createBackup(absolutePath);
      }
    }

    // Ensure parent directory exists
    const parentDir = dirname(absolutePath);
    await this.ensureDirectoryExists(parentDir);
    
    // Write the content
    try {
      await writeFile(absolutePath, params.content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${absolutePath}: ${(error as Error).message}`);
    }

    const relativePath = relative(workingDir, absolutePath);
    const lines = params.content.split('\n').length;
    const bytes = Buffer.byteLength(params.content, 'utf-8');
    
    const operation = isOverwrite ? 'Overwrote' : 'Created';
    
    let output = `${operation} ${relativePath}`;
    output += `\nContent: ${lines} lines, ${bytes} bytes`;
    
    if (params.createBackup && isOverwrite) {
      output += `\nBackup created: ${relativePath}.backup`;
    }

    return {
      title: `${operation} ${relativePath}`,
      output,
      metadata: {
        filePath: absolutePath,
        operation: isOverwrite ? 'overwrite' : 'create',
        lines,
        bytes,
        backupCreated: params.createBackup && isOverwrite
      }
    };
  }

  protected async checkPermissions(
    params: z.infer<typeof WriteToolSchema>,
    context: ToolExecutionContext
  ): Promise<void> {
    const workingDir = process.cwd();
    const absolutePath = this.validateFilePath(params.filePath, workingDir);
    
    // Additional security: prevent writing to sensitive system locations
    const sensitivePatterns = [
      '/etc/',
      '/usr/bin/',
      '/bin/',
      '/sbin/',
      '/System/',
      'node_modules/',
      '.git/',
    ];
    
    for (const pattern of sensitivePatterns) {
      if (absolutePath.includes(pattern)) {
        throw new ToolSecurityError(
          `Writing files to ${pattern} is not allowed for security reasons`
        );
      }
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.scr'];
    const ext = absolutePath.toLowerCase().substring(absolutePath.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(ext)) {
      throw new ToolSecurityError(
        `Writing executable files with extension ${ext} is not allowed for security reasons`
      );
    }
  }

  protected generateDefaultTitle(params: z.infer<typeof WriteToolSchema>): string {
    const workingDir = process.cwd();
    const relativePath = relative(workingDir, params.filePath);
    const operation = existsSync(this.validateFilePath(params.filePath, workingDir)) ? 'Overwrite' : 'Create';
    return `${operation} ${relativePath}`;
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

  private async createBackup(filePath: string): Promise<void> {
    const { copyFile } = await import('fs/promises');
    const backupPath = `${filePath}.backup`;
    
    try {
      await copyFile(filePath, backupPath);
    } catch (error) {
      throw new Error(`Failed to create backup of ${filePath}: ${(error as Error).message}`);
    }
  }
}

const DESCRIPTION = `
Write content to a file, creating it if it doesn't exist or overwriting if it does.

This tool provides secure file writing with the following features:
- Creates parent directories if they don't exist
- Validates file paths for security
- Optionally creates backups before overwriting
- Prevents writing to sensitive system locations
- Blocks creation of potentially dangerous executable files

Use cases:
- Creating new files with initial content
- Completely replacing file contents
- Generating configuration files
- Creating documentation or data files

Security features:
- Path validation and containment checking
- Sensitive location protection
- Executable file extension blocking
- Working directory restrictions

Note: This tool completely overwrites existing files. Use the edit tool for
partial modifications or the append functionality if you need to add content
to existing files.
`.trim();

const WriteToolSchema = z.object({
  filePath: z.string().describe('The path where to write the file (absolute or relative)'),
  content: z.string().describe('The content to write to the file'),
  createBackup: z.boolean().optional().default(false).describe('Create a backup of existing file before overwriting (default: false)')
});

// Export the tool instance
export const WriteTool = new WriteTool();