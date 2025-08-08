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
import { ToolRegistry } from './tools/ToolRegistry.js';
import { ProviderTransformRegistry } from './providers/ProviderTransformRegistry.js';
import { mergeDeep } from './util/merge.js';

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
  private orchestrator: Promise<SessionOrchestrator>;
  private config: Promise<CoreConfig.Info>;

  constructor(config?: CoreConfig.Info | Promise<CoreConfig.Info>) {
    this.config = Promise.resolve( config ?? CoreConfig.get());
    
    // Initialize all core components asynchronously
    this.orchestrator = this.initializeOrchestrator();
  }

  private async initializeOrchestrator(): Promise<SessionOrchestrator> {
    const config = await this.config;
    
    const sessionState = new SessionStateManager();
    const streamProcessor = new StreamEventProcessor(sessionState);
    const promptAssembler = new SystemPromptAssembler(config);
    const providerTransforms = new ProviderTransformRegistry();
    
    // Create concrete tool registry with all our implemented tools
    const baseRegistry = new ToolRegistry();
    const toolRegistry = new DynamicToolRegistry(baseRegistry, config, providerTransforms);
    
    return new SessionOrchestrator(
      config,
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
    const orchestrator = await this.orchestrator;
    return orchestrator.chat(input);
  }

  /**
   * Streaming interface for real-time conversation updates
   * 
   * Returns an async iterable of stream events that can be processed
   * in real-time for UI updates and intermediate processing.
   */
  async chatStream(input: ChatInput): Promise<AsyncIterable<StreamEvent>> {
    const orchestrator = await this.orchestrator;
    return orchestrator.chatStream(input);
  }

  // Session Management Methods

  /**
   * Get session information
   */
  async getSession(sessionId: string): Promise<SessionInfo> {
    const orchestrator = await this.orchestrator;
    return orchestrator.getSession(sessionId);
  }

  /**
   * Revert session to a specific message/part
   * 
   * Implements OpenCode's sophisticated revert functionality including
   * file system rollback and conversation state management.
   */
  async revertSession(sessionId: string, messageId: string, partId?: string): Promise<void> {
    const orchestrator = await this.orchestrator;
    return orchestrator.revert(sessionId, messageId, partId);
  }

  /**
   * Compress session conversation history
   * 
   * Uses AI-powered summarization to reduce context length while
   * preserving important information and recent conversation context.
   */
  async compressSession(sessionId: string): Promise<void> {
    const orchestrator = await this.orchestrator;
    return orchestrator.compress(sessionId);
  }

  // Provider Management Methods

  /**
   * Get list of available providers
   */
  async getAvailableProviders(): Promise<string[]> {
    const config = await this.config;
    return Array.from(config.providers.providers.keys());
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
  async getDefaultProvider(): Promise<string> {
    const config = await this.config;
    if (!config.providers.defaultProvider) {
      throw new Error('No default provider configured. Please set up at least one provider.');
    }
    return config.providers.defaultProvider;
  }

  // Tool Management Methods

  /**
   * Get available tools for a specific provider/model combination
   * 
   * Tools are dynamically filtered based on OpenCode's compatibility patterns
   * and transformed for provider-specific requirements.
   */
  async getAvailableTools(providerId: string, modelId: string): Promise<ProviderTool[]> {
    const orchestrator = await this.orchestrator;
    return orchestrator.getTools(providerId, modelId);
  }

  /**
   * Get tool recommendations for optimal performance
   */
  async getToolRecommendations(providerId: string, modelId: string) {
    const config = await this.config;
    const baseRegistry = new ToolRegistry();
    const toolRegistry = new DynamicToolRegistry(baseRegistry, config);
    return toolRegistry.getToolRecommendations(providerId, modelId);
  }

  /**
   * Validate tool compatibility
   */
  async validateToolCompatibility(toolName: string, providerId: string, modelId: string) {
    const config = await this.config;
    const baseRegistry = new ToolRegistry();
    const toolRegistry = new DynamicToolRegistry(baseRegistry, config);
    return toolRegistry.validateToolCompatibility(toolName, providerId, modelId);
  }

  // Configuration Methods

  /**
   * Get current configuration
   */
  async getConfig(): Promise<CoreConfig.Info> {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CoreConfig.Info>): void {
    // Would implement configuration updates
    console.log('Configuration update not yet implemented:', updates);
  }

  // Utility Methods

  /**
   * Check if core is properly initialized
   */
  async isReady(): Promise<boolean> {
    try {
      const config = await this.config;
      return config.providers.defaultProvider !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get initialization errors or warnings
   */
  async getInitializationStatus(): Promise<{
    ready: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const config = await this.config;
      
      if (!config.providers.defaultProvider) {
        errors.push('No default provider configured');
      }

      const providers = Array.from(config.providers.providers.keys());
      if (providers.length === 0) {
        errors.push('No providers available');
      } else if (providers.length === 1) {
        warnings.push('Only one provider available - consider adding more for redundancy');
      }
    } catch (error) {
      errors.push('Failed to load configuration');
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

  // Static Factory Methods (OpenCode-inspired)

  /**
   * Create a Core instance with default configuration
   */
  static async create(): Promise<Core> {
    return new Core();
  }

  /**
   * Create a Core instance optimized for CLI usage
   */
  static async forCLI(): Promise<Core> {
    const config = await CoreConfig.forCLI();
    return new Core(config);
  }

  /**
   * Create a Core instance optimized for extension usage
   */
  static async forExtension(): Promise<Core> {
    const config = await CoreConfig.forExtension();
    return new Core(config);
  }

  /**
   * Create a Core instance with custom configuration
   */
  static async withConfig(config: Partial<CoreConfig.Info>): Promise<Core> {
    const baseConfig = await CoreConfig.get();
    const mergedConfig = mergeDeep(baseConfig, config);
    return new Core(mergedConfig);
  }
}


// Export everything needed for external use
export * from './types/index.js';
export { CoreConfig } from './config/CoreConfig.js';
export { SessionOrchestrator } from './orchestration/SessionOrchestrator.js';
export { DynamicToolRegistry } from './tools/DynamicToolRegistry.js';
export { ProviderTransformRegistry } from './providers/ProviderTransformRegistry.js';
export { SystemPromptAssembler } from './prompts/SystemPromptAssembler.js';
