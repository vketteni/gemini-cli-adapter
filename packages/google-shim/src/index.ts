/**
 * Google Gemini CLI Core Compatibility Shim
 * 
 * This package provides a compatibility layer that exports the exact same API
 * as @google/gemini-cli-core, but internally uses our clean CoreAdapter interface.
 * 
 * This allows cli-frontend to use package aliasing while maintaining a clean
 * internal architecture for adapter developers.
 */

import {
  CoreAdapter,
  ChatEvent,
  ChatConfig,
  AdapterConfig,
  ValidationResult,
  ToolMetadata,
  ToolRequest,
  ToolEvent,
  Icon,
  AuthType,
  EditorType,
  ApprovalMode,
  IDEConnectionStatus,
  UserTierId,
  ToolConfirmationOutcome,
  ThoughtSummary,
  ToolCallStats,
  ToolCallConfirmationDetails,
  Tool,
  ToolRegistry,
  GeminiClient,
  GitService,
  FileDiscoveryService,
  TelemetryService,
  GeminiCLIExtension,
  IdeContext,
  File,
  getErrorMessage,
  isNodeError,
  UnauthorizedError,
  SandboxConfig,
  MCPServerConfig,
  CodeAssistServer
} from '@gemini-cli-adapter/core-interface';

// Re-export all types that cli-frontend expects
export { Icon };
// Extend AuthType with Google-specific values
export enum AuthType {
  API_KEY = 'api_key',
  OAUTH = 'oauth', 
  SERVICE_ACCOUNT = 'service_account',
  LOGIN_WITH_GOOGLE = 'login_with_google',
  USE_VERTEX_AI = 'use_vertex_ai',
  USE_GEMINI = 'use_gemini'
}
export { EditorType };
export { ApprovalMode };
export { IDEConnectionStatus };
// Extend UserTierId with Google-specific values  
export enum UserTierId {
  FREE = 'free',
  PAID = 'paid', 
  ENTERPRISE = 'enterprise',
  LEGACY = 'legacy',
  STANDARD = 'standard'
}
export { ToolConfirmationOutcome };
export { ThoughtSummary };
export { ToolCallStats };
export { ToolCallConfirmationDetails };
export { Tool };
export { ToolRegistry };
export { GeminiClient };
export { GitService };
export { FileDiscoveryService };
export { TelemetryService };
export { GeminiCLIExtension };
export { IdeContext };
export { File };
export { getErrorMessage };
export { isNodeError };
export { UnauthorizedError };
export { SandboxConfig };
export { MCPServerConfig };
export { CodeAssistServer };

// Map our clean types to Google's expected names
export type Config = AdapterConfig;

// Google-specific event types (map to our ChatEvent)
export enum GeminiEventType {
  CONTENT = 'content',
  ERROR = 'error',
  FINISHED = 'finished',
  COMPRESSED = 'compressed'
}

export interface ServerGeminiStreamEvent {
  type: GeminiEventType;
  data: unknown;
  timestamp: Date;
}

export interface ServerGeminiContentEvent extends ServerGeminiStreamEvent {
  type: GeminiEventType.CONTENT;
  content: string;
}

export interface ServerGeminiErrorEvent extends ServerGeminiStreamEvent {
  type: GeminiEventType.ERROR;
  error: string;
}

export interface ServerGeminiFinishedEvent extends ServerGeminiStreamEvent {
  type: GeminiEventType.FINISHED;
  finishReason?: string;
}

export interface ServerGeminiChatCompressedEvent extends ServerGeminiStreamEvent {
  type: GeminiEventType.COMPRESSED;
  compressedContent: string;
}

// Other Google-specific types
export enum MessageSenderType {
  USER = 'user',
  GEMINI = 'gemini',
  SYSTEM = 'system'
}

export interface ToolCallRequestInfo {
  id: string;
  name: string;
  args: Record<string, any>;
}

export interface UserPromptEvent {
  prompt: string;
  timestamp: number;
}

// Utility functions
export function logUserPrompt(event: UserPromptEvent): void {
  console.log(`[${new Date(event.timestamp).toISOString()}] User: ${event.prompt}`);
}

// Utility function types (will be implemented by adapter)
export function getProjectTempDir(): string {
  // TODO: Implement via adapter
  return '/tmp';
}

export async function isGitRepository(path?: string): Promise<boolean> {
  // TODO: Implement via adapter
  return false;
}

export function isEditorAvailable(editor: string): boolean {
  // TODO: Implement via adapter
  return false;
}

export function shortenPath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) return path;
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  
  return `.../${parts.slice(-2).join('/')}`;
}

export function tildeifyPath(path: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home && path.startsWith(home)) {
    return path.replace(home, '~');
  }
  return path;
}

export function tokenLimit(text: string, limit: number): string {
  // Simple approximation: ~4 chars per token
  const approxTokens = text.length / 4;
  if (approxTokens <= limit) return text;
  
  const targetLength = limit * 4;
  return text.substring(0, targetLength) + '...';
}

export function unescapePath(path: string): string {
  return path.replace(/\\(.)/g, '$1');
}

export function sessionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Default constants
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-1.5-flash';

// Global adapter bridge
let globalAdapter: CoreAdapter | null = null;

export function setGlobalAdapter(adapter: CoreAdapter): void {
  globalAdapter = adapter;
}

export function getGlobalAdapter(): CoreAdapter {
  if (!globalAdapter) {
    throw new Error('Adapter not initialized. Call setGlobalAdapter() first.');
  }
  return globalAdapter;
}

// Create services that use the global adapter
export const uiTelemetryService: TelemetryService = {
  logEvent: (event: string, data?: Record<string, unknown>) => {
    // TODO: Implement via adapter
    console.log(`[Telemetry] ${event}`, data);
  },
  logError: (error: Error, context?: Record<string, unknown>) => {
    // TODO: Implement via adapter
    console.error(`[Telemetry Error]`, error, context);
  }
};

// Export a default GitService implementation
export const gitService: GitService = {
  async getCurrentBranch(): Promise<string> {
    // TODO: Implement via adapter
    return 'main';
  },
  async getStatus(): Promise<string> {
    // TODO: Implement via adapter
    return '';
  },
  async getInfo() {
    // TODO: Implement via adapter
    return {
      branch: 'main',
      commit: 'unknown',
      status: 'clean' as const
    };
  },
  async isRepository(): Promise<boolean> {
    // TODO: Implement via adapter
    return false;
  }
};

// Status enum for tool calls
export enum Status {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Re-export Status as ToolCallStatusType for backward compatibility
export { Status as ToolCallStatusType };