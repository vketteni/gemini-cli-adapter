/**
 * Core interface definitions for GEMINI CLI adapters
 */

export * from './adapter.js';

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

/**
 * Authentication types for different providers
 */
export enum AuthType {
  LOGIN_WITH_GOOGLE = 'oauth-personal',
  USE_GEMINI = 'gemini-api-key',
  USE_VERTEX_AI = 'vertex-ai',
  CLOUD_SHELL = 'cloud-shell',
}

/**
 * Icon types for tool display
 */
export enum Icon {
  FileSearch = 'fileSearch',
  Folder = 'folder',
  Globe = 'globe',
  Hammer = 'hammer',
  LightBulb = 'lightBulb',
  Pencil = 'pencil',
  Regex = 'regex',
  Terminal = 'terminal',
}
