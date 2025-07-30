/**
 * Service interface definitions
 */

import { GitInfo, FileInfo } from '../index.js';

export interface GeminiClient {
  sendMessage(sessionId: string, message: string): AsyncIterable<any>;
  createSession(config: any): Promise<string>;
  // Additional methods as needed
}

export interface GitService {
  getCurrentBranch(): Promise<string>;
  getStatus(): Promise<string>;
  getInfo(): Promise<GitInfo>;
  isRepository(): Promise<boolean>;
}

export interface FileDiscoveryService {
  discoverFiles(pattern: string): Promise<FileInfo[]>;
  getFileContent(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
}

export interface TelemetryService {
  logEvent(event: string, data?: Record<string, unknown>): void;
  logError(error: Error, context?: Record<string, unknown>): void;
}

export interface GeminiCLIExtension {
  name: string;
  version: string;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
}

// Context interfaces
export interface IdeContext {
  workspacePath?: string;
  activeFile?: string;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
}

export interface File {
  path: string;
  content?: string;
  language?: string;
  size?: number;
  modified?: Date;
}

// Utility function types
export type GetErrorMessage = (error: unknown) => string;
export type GetProjectTempDir = () => string;
export type IsGitRepository = (path?: string) => Promise<boolean>;
export type IsNodeError = (error: unknown) => boolean;
export type IsEditorAvailable = (editor: string) => boolean;
export type ShortenPath = (path: string, maxLength?: number) => string;
export type TildeifyPath = (path: string) => string;
export type TokenLimit = (text: string, limit: number) => string;
export type UnescapePath = (path: string) => string;
export type SessionId = () => string;