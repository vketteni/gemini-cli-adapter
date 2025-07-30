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

import { CoreAdapter, ChatEvent, ToolEvent, AdapterConfig, ChatConfig, ToolMetadata, ToolRequest, ValidationResult } from '@gemini-cli-adapter/core-interface';

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

export interface ServerGeminiStreamEvent extends ChatEvent {
  type: GeminiEventType;
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

// Utility functions
export function getErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

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
  
  constructor(adapter: CoreAdapter) {
    this.adapter = adapter;
  }
  
  createGeminiClient(): GeminiClient {
    return {
      sendMessage: (sessionId: string, message: string) => this.adapter.sendMessage(sessionId, message),
      createSession: (config: ChatConfig) => this.adapter.createSession(config)
    };
  }
  
  async getConfig(): Promise<Config> {
    // TODO: Return appropriate config for the adapter
    return {} as Config;
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