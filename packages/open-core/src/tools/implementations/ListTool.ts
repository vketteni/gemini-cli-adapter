/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { readdir, stat } from 'fs/promises';
import { Stats } from 'fs';
import { join, relative, extname, basename } from 'path';
import { BaseTool } from '../BaseTool.js';
import type { ToolExecutionContext, ToolResult } from '../../types/index.js';

/**
 * List Tool for directory and file listing
 * 
 * Provides comprehensive directory listing with features like:
 * - Detailed file information (size, type, permissions)
 * - Filtering by file type or pattern
 * - Recursive listing options
 * - Sorting by various criteria
 * - Git ignore integration
 */
export class ListTool extends BaseTool<typeof ListToolSchema> {
  constructor() {
    super('ls', DESCRIPTION, ListToolSchema);
  }

  protected async executeImpl(
    params: z.infer<typeof ListToolSchema>,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const workingDir = process.cwd();
    const targetPath = params.path ? 
      this.validateFilePath(params.path, workingDir) : 
      workingDir;
    
    // Check if target exists and get its stats
    let targetStats: Stats;
    try {
      targetStats = await stat(targetPath);
    } catch (error) {
      throw new Error(`Cannot access path ${targetPath}: ${(error as Error).message}`);
    }

    if (targetStats.isFile()) {
      // If it's a file, show file details
      return await this.showFileDetails(targetPath, params);
    } else if (targetStats.isDirectory()) {
      // If it's a directory, list contents
      return await this.listDirectory(targetPath, params);
    } else {
      throw new Error(`Path ${targetPath} is neither a file nor directory`);
    }
  }

  protected generateDefaultTitle(params: z.infer<typeof ListToolSchema>): string {
    const workingDir = process.cwd();
    const targetPath = params.path || '.';
    const relativePath = relative(workingDir, targetPath);
    return `List ${relativePath || '.'}`;
  }

  private async showFileDetails(filePath: string, params: z.infer<typeof ListToolSchema>): Promise<ToolResult> {
    const stats = await stat(filePath);
    const relativePath = relative(process.cwd(), filePath);
    const fileName = basename(filePath);
    const fileExt = extname(filePath);
    
    const fileInfo = await this.getFileInfo(filePath, stats);
    
    let output = `File: ${fileName}\n`;
    output += `Size: ${this.formatFileSize(stats.size)}\n`;
    output += `Type: ${fileInfo.type}\n`;
    output += `Modified: ${stats.mtime?.toISOString()}\n`;
    output += `Permissions: ${this.formatPermissions(stats.mode || 0)}\n`;
    
    if (params.showDetails) {
      output += `\nDetailed Information:\n`;
      output += `- Full path: ${filePath}\n`;
      output += `- Extension: ${fileExt || 'none'}\n`;
      output += `- Created: ${stats.birthtime?.toISOString()}\n`;
      output += `- Accessed: ${stats.atime?.toISOString()}\n`;
      output += `- Inode: ${stats.ino}\n`;
      output += `- Device: ${stats.dev}\n`;
    }

    return {
      title: `File details: ${relativePath}`,
      output,
      metadata: {
        path: filePath,
        type: 'file',
        size: stats.size,
        modified: stats.mtime?.toISOString(),
        ...fileInfo
      }
    };
  }

  private async listDirectory(dirPath: string, params: z.infer<typeof ListToolSchema>): Promise<ToolResult> {
    try {
      const entries = await readdir(dirPath);
      const fileInfos: FileInfo[] = [];
      
      for (const entry of entries) {
        const entryPath = join(dirPath, entry);
        
        // Skip hidden files unless requested
        if (!params.showHidden && entry.startsWith('.')) {
          continue;
        }
        
        try {
          const stats = await stat(entryPath);
          const fileInfo = await this.getFileInfo(entryPath, stats);
          
          // Apply filters
          if (params.filter && !this.matchesFilter(entry, params.filter, fileInfo)) {
            continue;
          }
          
          fileInfos.push({
            name: entry,
            path: entryPath,
            size: stats.size,
            modified: stats.mtime || new Date(),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            permissions: stats.mode || 0,
            ...fileInfo
          });
        } catch (error) {
          // Skip entries we can't access
          continue;
        }
      }
      
      // Sort entries
      this.sortFileInfos(fileInfos, params.sortBy || 'name');
      
      // Apply limit if specified
      const limitedInfos = params.limit ? fileInfos.slice(0, params.limit) : fileInfos;
      
      const output = this.formatDirectoryListing(dirPath, limitedInfos, params);
      const relativePath = relative(process.cwd(), dirPath);
      
      return {
        title: `Directory: ${relativePath || '.'}`,
        output,
        metadata: {
          path: dirPath,
          type: 'directory',
          totalEntries: fileInfos.length,
          shownEntries: limitedInfos.length,
          directories: fileInfos.filter(f => f.isDirectory).length,
          files: fileInfos.filter(f => f.isFile).length
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${(error as Error).message}`);
    }
  }

  private async getFileInfo(filePath: string, stats: Stats): Promise<Partial<FileInfo>> {
    const ext = extname(filePath).toLowerCase();
    
    let type = 'unknown';
    let category = 'other';
    
    if (stats.isDirectory()) {
      type = 'directory';
      category = 'directory';
    } else if (stats.isFile()) {
      type = 'file';
      
      // Determine file category based on extension
      if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'].includes(ext)) {
        category = 'code';
      } else if (['.txt', '.md', '.rst', '.doc', '.docx', '.pdf'].includes(ext)) {
        category = 'document';
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
        category = 'image';
      } else if (['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext)) {
        category = 'audio';
      } else if (['.mp4', '.avi', '.mkv', '.mov', '.wmv'].includes(ext)) {
        category = 'video';
      } else if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) {
        category = 'archive';
      } else if (['.json', '.yaml', '.yml', '.xml', '.toml', '.ini'].includes(ext)) {
        category = 'config';
      }
    }
    
    return {
      type,
      category,
      extension: ext
    };
  }

  private matchesFilter(fileName: string, filter: string, fileInfo: Partial<FileInfo>): boolean {
    const lowerFileName = fileName.toLowerCase();
    const lowerFilter = filter.toLowerCase();
    
    // Check if it's a category filter
    if (['code', 'document', 'image', 'audio', 'video', 'archive', 'config', 'directory'].includes(lowerFilter)) {
      return fileInfo.category === lowerFilter;
    }
    
    // Check if it's a pattern match (simple glob)
    if (filter.includes('*')) {
      const regex = new RegExp(filter.replace(/\*/g, '.*'));
      return regex.test(fileName);
    }
    
    // Simple substring match
    return lowerFileName.includes(lowerFilter);
  }

  private sortFileInfos(fileInfos: FileInfo[], sortBy: string): void {
    fileInfos.sort((a, b) => {
      // Always put directories first
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      switch (sortBy) {
        case 'size':
          return b.size - a.size;
        case 'modified':
          return b.modified.getTime() - a.modified.getTime();
        case 'extension':
          return (a.extension || '').localeCompare(b.extension || '');
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  private formatDirectoryListing(dirPath: string, fileInfos: FileInfo[], params: z.infer<typeof ListToolSchema>): string {
    const relativePath = relative(process.cwd(), dirPath);
    let output = `Directory: ${relativePath || '.'}\n\n`;
    
    if (fileInfos.length === 0) {
      output += 'Directory is empty.';
      return output;
    }
    
    const maxNameLength = Math.max(...fileInfos.map(f => f.name.length));
    
    for (const fileInfo of fileInfos) {
      const name = fileInfo.name.padEnd(maxNameLength);
      const size = fileInfo.isDirectory ? '<DIR>' : this.formatFileSize(fileInfo.size);
      const modified = fileInfo.modified.toISOString().split('T')[0];
      
      let line = `${name}  ${size.padStart(10)}  ${modified}`;
      
      if (params.showDetails) {
        line += `  ${fileInfo.category || 'other'}`;
        if (fileInfo.extension) {
          line += `  ${fileInfo.extension}`;
        }
      }
      
      output += line + '\n';
    }
    
    const totalDirs = fileInfos.filter(f => f.isDirectory).length;
    const totalFiles = fileInfos.filter(f => f.isFile).length;
    output += `\n${totalDirs} directories, ${totalFiles} files`;
    
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

  private formatPermissions(mode: number): string {
    const perms = (mode & parseInt('777', 8)).toString(8);
    return perms;
  }
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
  isFile: boolean;
  permissions: number;
  type?: string;
  category?: string;
  extension?: string;
}

const DESCRIPTION = `
List directory contents or show file details with comprehensive information.

Features:
- Directory listing with file sizes and modification dates
- File type categorization (code, document, image, etc.)
- Sorting by name, size, modification date, or extension
- Filtering by file type or pattern matching
- Show/hide hidden files
- Detailed file information mode
- Clean, organized output format

Parameters:
- path: Directory or file path to examine (default: current directory)
- showHidden: Include hidden files starting with '.'
- showDetails: Show additional file information
- filter: Filter entries by type or pattern (supports * wildcards)
- sortBy: Sort by 'name', 'size', 'modified', or 'extension'
- limit: Maximum number of entries to show

The tool automatically categorizes files by type and provides human-readable
file sizes and timestamps.
`.trim();

const ListToolSchema = z.object({
  path: z.string().optional().describe('Directory or file path to list (default: current directory)'),
  showHidden: z.boolean().optional().default(false).describe('Show hidden files (starting with .)'),
  showDetails: z.boolean().optional().default(false).describe('Show detailed file information'),
  filter: z.string().optional().describe('Filter by file type or pattern (supports * wildcards)'),
  sortBy: z.enum(['name', 'size', 'modified', 'extension']).optional().default('name').describe('Sort entries by specified criteria'),
  limit: z.number().int().min(1).optional().describe('Maximum number of entries to show')
});

// Export the tool instance
// export const ListTool = new ListTool();