/**
 * Core interface definitions for GEMINI CLI adapters
 */

export * from './types/adapter.js';
export * from './types/chat.js';
export * from './types/tools.js';
export * from './types/config.js';
export * from './types/services.js';
export * from './types/errors.js';

// Re-export specific types for convenience
export { Icon } from './types/tools.js';
export { AuthType, EditorType, ApprovalMode, IDEConnectionStatus, UserTierId } from './types/config.js';
export { ToolConfirmationOutcome } from './types/tools.js';
export { getErrorMessage, isNodeError, UnauthorizedError } from './types/errors.js';

/**
 * Shared types across all packages
 */

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface FileInfo {
  path: string;
  size: number;
  modified: Date;
}

export interface GitInfo {
  branch: string;
  commit: string;
  status: 'clean' | 'dirty';
}
