/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ChatInput,
  ChatResponse,
  SessionInfo,
  StreamEvent,
  ProviderTool,
  ModelCapabilities
} from './types/index.js';
import { CoreConfig } from './config/CoreConfig.js';
import { SessionOrchestrator } from './orchestration/SessionOrchestrator.js';
import { SessionStateManager } from './state/SessionStateManager.js';
import { StreamEventProcessor } from './streaming/StreamEventProcessor.js';
import { SystemPromptAssembler } from './prompts/SystemPromptAssembler.js';
import { DynamicToolRegistry } from './tools/DynamicToolRegistry.js';
import { ProviderTransformRegistry } from './providers/ProviderTransformRegistry.js';

/**
 * Core - OpenCode-inspired central orchestration engine
 * 
 * This is the primary entry point for all agentic interactions in Open CLI.
 * It implements OpenCode's sophisticated orchestration patterns while maintaining
 * compatibility with Open CLI's existing provider ecosystem.
 * 
 * Key features:
 * - Single point of control for all conversations
 * - Advanced session management with locking, queuing, and compression
 * - Provider-specific optimizations and transforms  
 * - Dynamic tool filtering based on model capabilities
 * - Event-driven streaming architecture
 * - Comprehensive state management with revert capabilities
 */
export class Core {
  private orchestrator: SessionOrchestrator;
  private config: CoreConfig;

  constructor(config?: CoreConfig) {
    this.config = config || CoreConfig.fromEnvironment();
    
    // Initialize all core components
    const sessionState = new SessionStateManager();
    const streamProcessor = new StreamEventProcessor(sessionState);
    const promptAssembler = new SystemPromptAssembler(this.config);
    const providerTransforms = new ProviderTransformRegistry();
    
    // Create mock base registry for now - would integrate with existing Open CLI registry
    const baseRegistry = new MockToolRegistry();
    const toolRegistry = new DynamicToolRegistry(baseRegistry, this.config, providerTransforms);
    
    this.orchestrator = new SessionOrchestrator(
      this.config,
      sessionState,
      streamProcessor,
      promptAssembler,
      toolRegistry,
      providerTransforms
    );
  }

  /**
   * Primary interface - all conversations flow through this
   * 
   * This is the OpenCode Session.chat() equivalent that handles the complete
   * conversation flow from input processing to response generation.
   */
  async chat(input: ChatInput): Promise<ChatResponse> {
    return this.orchestrator.chat(input);
  }

  /**
   * Streaming interface for real-time conversation updates
   * 
   * Returns an async iterable of stream events that can be processed
   * in real-time for UI updates and intermediate processing.
   */
  async chatStream(input: ChatInput): Promise<AsyncIterable<StreamEvent>> {
    return this.orchestrator.chatStream(input);
  }

  // Session Management Methods

  /**
   * Get session information
   */
  async getSession(sessionId: string): Promise<SessionInfo> {
    return this.orchestrator.getSession(sessionId);
  }

  /**
   * Revert session to a specific message/part
   * 
   * Implements OpenCode's sophisticated revert functionality including
   * file system rollback and conversation state management.
   */
  async revertSession(sessionId: string, messageId: string, partId?: string): Promise<void> {
    return this.orchestrator.revert(sessionId, messageId, partId);
  }

  /**
   * Compress session conversation history
   * 
   * Uses AI-powered summarization to reduce context length while
   * preserving important information and recent conversation context.
   */
  async compressSession(sessionId: string): Promise<void> {
    return this.orchestrator.compress(sessionId);
  }

  // Provider Management Methods

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return this.config.providers.listProviders();
  }

  /**
   * Get provider capabilities for optimization decisions
   */
  getProviderCapabilities(providerId: string, modelId: string): ModelCapabilities {
    const transforms = new ProviderTransformRegistry();
    return transforms.getModelCapabilities(providerId, modelId);
  }

  /**
   * Get default provider configuration
   */
  getDefaultProvider(): string {
    try {
      return this.config.providers.getDefaultProvider().name;
    } catch {
      throw new Error('No default provider configured. Please set up at least one provider.');
    }
  }

  // Tool Management Methods

  /**
   * Get available tools for a specific provider/model combination
   * 
   * Tools are dynamically filtered based on OpenCode's compatibility patterns
   * and transformed for provider-specific requirements.
   */
  async getAvailableTools(providerId: string, modelId: string): Promise<ProviderTool[]> {
    return this.orchestrator.getTools(providerId, modelId);
  }

  /**
   * Get tool recommendations for optimal performance
   */
  getToolRecommendations(providerId: string, modelId: string) {
    const toolRegistry = new DynamicToolRegistry(new MockToolRegistry(), this.config);
    return toolRegistry.getToolRecommendations(providerId, modelId);
  }

  /**
   * Validate tool compatibility
   */
  validateToolCompatibility(toolName: string, providerId: string, modelId: string) {
    const toolRegistry = new DynamicToolRegistry(new MockToolRegistry(), this.config);
    return toolRegistry.validateToolCompatibility(toolName, providerId, modelId);
  }

  // Configuration Methods

  /**
   * Get current configuration
   */
  getConfig(): CoreConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<any>): void {
    // Would implement configuration updates
    console.log('Configuration update not yet implemented:', updates);
  }

  // Utility Methods

  /**
   * Check if core is properly initialized
   */
  isReady(): boolean {
    try {
      this.config.providers.getDefaultProvider();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get initialization errors or warnings
   */
  getInitializationStatus(): {
    ready: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.config.providers.getDefaultProvider();
    } catch (error) {
      errors.push('No default provider configured');
    }

    const providers = this.config.providers.listProviders();
    if (providers.length === 0) {
      errors.push('No providers available');
    } else if (providers.length === 1) {
      warnings.push('Only one provider available - consider adding more for redundancy');
    }

    return {
      ready: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    // Clean up resources
    console.log('Core disposal not yet implemented');
  }
}

// Mock tool registry for development - replace with actual Open CLI registry integration
class MockToolRegistry {
  private tools = [
    {
      name: 'edit',
      description: 'Edit files using find-and-replace operations',
      schema: {
        name: 'edit',
        description: 'Edit files using find-and-replace operations',
        parameters: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the file to edit' },
            old_string: { type: 'string', description: 'String to replace' },
            new_string: { type: 'string', description: 'Replacement string' }
          },
          required: ['file_path', 'old_string', 'new_string']
        }
      },
      execute: async () => ({ output: 'Mock edit result' })
    },
    {
      name: 'read_file',
      description: 'Read file contents',
      schema: {
        name: 'read_file',
        description: 'Read file contents',
        parameters: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the file to read' }
          },
          required: ['file_path']
        }
      },
      execute: async () => ({ output: 'Mock file content' })
    },
    {
      name: 'write_file',
      description: 'Write content to a file',
      schema: {
        name: 'write_file',
        description: 'Write content to a file',
        parameters: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the file to write' },
            content: { type: 'string', description: 'Content to write' }
          },
          required: ['file_path', 'content']
        }
      },
      execute: async () => ({ output: 'File written successfully' })
    }
  ];

  async getAllTools() {
    return this.tools;
  }

  async getTool(name: string) {
    return this.tools.find(t => t.name === name);
  }
}

// Export everything needed for external use
export * from './types/index.js';
export { CoreConfig } from './config/CoreConfig.js';
export { SessionOrchestrator } from './orchestration/SessionOrchestrator.js';
export { DynamicToolRegistry } from './tools/DynamicToolRegistry.js';
export { ProviderTransformRegistry } from './providers/ProviderTransformRegistry.js';
export { SystemPromptAssembler } from './prompts/SystemPromptAssembler.js';
