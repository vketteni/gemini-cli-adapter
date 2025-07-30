/**
 * Core adapter interface that all AI providers must implement
 */

import { ChatConfig, ChatEvent } from './chat.js';
import { ToolMetadata, ToolRequest, ToolEvent } from './tools.js';
import { AdapterConfig, ValidationResult } from './config.js';

export interface CoreAdapter {
  /**
   * Unique identifier for this adapter
   */
  readonly id: string;
  
  /**
   * Human-readable name for this adapter
   */
  readonly name: string;
  
  /**
   * Version of the adapter
   */
  readonly version: string;
  
  /**
   * Create a new chat session
   */
  createSession(config: ChatConfig): Promise<string>;
  
  /**
   * Send a message and receive streaming response
   */
  sendMessage(sessionId: string, message: string): AsyncIterable<ChatEvent>;
  
  /**
   * Get available tools for this adapter
   */
  getAvailableTools(): Promise<ToolMetadata[]>;
  
  /**
   * Execute tools with streaming updates
   */
  executeTools(requests: ToolRequest[]): AsyncIterable<ToolEvent>;
  
  /**
   * Validate adapter configuration
   */
  validateConfig(config: AdapterConfig): Promise<ValidationResult>;
  
  /**
   * Initialize the adapter
   */
  initialize(): Promise<void>;
  
  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}
