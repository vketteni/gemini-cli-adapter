/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AdapterBridge - Provides a transition layer between the original Google CLI
 * and our new CoreAdapter interface system.
 * 
 * This bridge allows the existing Google CLI code to work unchanged while
 * we gradually migrate to the new adapter pattern.
 */

import { 
  CoreAdapter, 
  ChatEvent, 
  ToolEvent, 
  AdapterConfig, 
  ChatConfig, 
  ToolMetadata, 
  ToolRequest, 
  ValidationResult,
  Logger,
  AdapterError,
  SessionError,
  getErrorMessage
} from '@gemini-cli-adapter/core-interface';

// Re-export types that the CLI expects from the original core
export interface Config extends AdapterConfig {}
export interface GeminiClient {
  sendMessage(sessionId: string, message: string): AsyncIterable<ChatEvent>;
  createSession(config: ChatConfig): Promise<string>;
}

// Event types that match the original Google CLI expectations
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

// Other types that the CLI expects
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

export interface ThoughtSummary {
  summary: string;
  wordCount: number;
}

export interface UserPromptEvent {
  prompt: string;
  timestamp: number;
}

export enum EditorType {
  VSCODE = 'vscode',
  CURSOR = 'cursor',
  JETBRAINS = 'jetbrains'
}

// Error types
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Utility functions - re-export from core-interface
export { getErrorMessage } from '@gemini-cli-adapter/core-interface';

export function isNodeError(error: any): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export function logUserPrompt(event: UserPromptEvent): void {
  console.log(`[${new Date(event.timestamp).toISOString()}] User: ${event.prompt}`);
}

// Services that need to be implemented via adapter
export class GitService {
  async getCurrentBranch(): Promise<string> {
    // TODO: Implement via adapter
    return 'main';
  }
  
  async getStatus(): Promise<string> {
    // TODO: Implement via adapter
    return '';
  }
}

// Bridge class that connects existing CLI to new adapter system
export class AdapterBridge {
  private adapter: CoreAdapter;
  private sessions: Map<string, { config: ChatConfig; created: Date }> = new Map();
  private currentConfig: Config | null = null;
  private logger: Logger;
  
  constructor(adapter: CoreAdapter, logger?: Logger) {
    this.adapter = adapter;
    this.logger = logger || this.createDefaultLogger();
    this.logger.info(`AdapterBridge initialized with adapter: ${adapter.name} v${adapter.version}`);
  }
  
  private createDefaultLogger(): Logger {
    return {
      debug: (message: string, ...args: unknown[]) => console.debug(`[AdapterBridge] ${message}`, ...args),
      info: (message: string, ...args: unknown[]) => console.info(`[AdapterBridge] ${message}`, ...args),
      warn: (message: string, ...args: unknown[]) => console.warn(`[AdapterBridge] ${message}`, ...args),
      error: (message: string, ...args: unknown[]) => console.error(`[AdapterBridge] ${message}`, ...args)
    };
  }
  
  createGeminiClient(): GeminiClient {
    const self = this;
    return {
      sendMessage: async function* (sessionId: string, message: string) {
        try {
          self.logger.debug(`Sending message to session ${sessionId}: ${message.substring(0, 100)}...`);
          
          // Validate session exists
          if (!self.sessions.has(sessionId)) {
            const error = new SessionError(`Session ${sessionId} not found`, sessionId);
            self.logger.error(`Session validation failed: ${error.message}`);
            throw error;
          }
          
          // Delegate to adapter with error wrapping
          const messageStream = self.adapter.sendMessage(sessionId, message);
          
          for await (const event of messageStream) {
            self.logger.debug(`Received event from adapter: ${event.type}`);
            yield event;
          }
          
          self.logger.debug(`Message stream completed for session ${sessionId}`);
          
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          self.logger.error(`Error in sendMessage for session ${sessionId}: ${errorMessage}`);
          
          if (error instanceof AdapterError) {
            throw error;
          } else {
            throw new SessionError(`Failed to send message: ${errorMessage}`, sessionId);
          }
        }
      },
      
      createSession: async (config: ChatConfig) => {
        try {
          self.logger.debug(`Creating new session with config: ${JSON.stringify(config)}`);
          
          const sessionId = await self.adapter.createSession(config);
          
          // Track session for management
          self.sessions.set(sessionId, {
            config,
            created: new Date()
          });
          
          self.logger.info(`Created session ${sessionId} successfully`);
          return sessionId;
          
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          self.logger.error(`Failed to create session: ${errorMessage}`);
          
          if (error instanceof AdapterError) {
            throw error;
          } else {
            throw new SessionError(`Failed to create session: ${errorMessage}`);
          }
        }
      }
    };
  }
  
  async getConfig(): Promise<Config> {
    if (!this.currentConfig) {
      // Build config from adapter capabilities
      this.currentConfig = {
        apiKey: process.env.GEMINI_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com',
        timeout: 30000,
        retries: 3,
        authType: 'api_key' as any,
        userTier: 'free' as any,
        approvalMode: 'always_ask' as any
      };
    }
    return this.currentConfig;
  }
  
  // Session management methods
  async cleanupExpiredSessions(maxAgeMs: number = 3600000): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now.getTime() - session.created.getTime() > maxAgeMs) {
        expiredSessions.push(sessionId);
      }
    }
    
    for (const sessionId of expiredSessions) {
      this.sessions.delete(sessionId);
      // Could notify adapter to cleanup if needed
    }
  }
  
  getSessionInfo(sessionId: string) {
    return this.sessions.get(sessionId);
  }
  
  getAllSessions() {
    return Array.from(this.sessions.entries()).map(([id, session]) => ({
      id,
      ...session
    }));
  }
}

// Default constants
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-1.5-flash';

// Global bridge instance - will be set during app initialization
let globalBridge: AdapterBridge | null = null;

export function setGlobalAdapter(adapter: CoreAdapter): void {
  globalBridge = new AdapterBridge(adapter);
}

export function getGlobalBridge(): AdapterBridge {
  if (!globalBridge) {
    throw new Error('Adapter bridge not initialized. Call setGlobalAdapter() first.');
  }
  return globalBridge;
}