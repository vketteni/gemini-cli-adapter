/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ChatInput,
  ChatResponse,
  MessageInfo,
  MessagePart,
  SessionInfo,
  QueuedRequest,
  StoredMessage,
  ModelMessage,
  StreamEvent,
  ProviderTool
} from '../types/index.js';
import type { CoreConfig } from '../config/CoreConfig.js';
import { SessionStateManager } from '../state/SessionStateManager.js';
import { StreamEventProcessor } from '../streaming/StreamEventProcessor.js';
import { SystemPromptAssembler } from '../prompts/SystemPromptAssembler.js';
import { DynamicToolRegistry } from '../tools/DynamicToolRegistry.js';
import { ProviderTransformRegistry } from '../providers/ProviderTransformRegistry.js';
import { generateId } from '../utils/identifiers.js';

/**
 * Session Orchestrator - OpenCode-inspired central coordinator for all agentic interactions
 * 
 * This class implements the session orchestration pattern from OpenCode, providing:
 * - Single point of control for all conversations
 * - Session state management (locks, queuing, cleanup)
 * - Auto-compression when approaching context limits
 * - Provider-specific optimizations and transforms
 * - Event-driven streaming coordination
 * - Tool execution coordination
 */
export class SessionOrchestrator {
  private sessionState: SessionStateManager;
  private streamProcessor: StreamEventProcessor;
  private promptAssembler: SystemPromptAssembler;
  private toolRegistry: DynamicToolRegistry;
  private providerTransforms: ProviderTransformRegistry;

  constructor(
    private config: CoreConfig,
    sessionState: SessionStateManager,
    streamProcessor: StreamEventProcessor,
    promptAssembler: SystemPromptAssembler,
    toolRegistry: DynamicToolRegistry,
    providerTransforms: ProviderTransformRegistry
  ) {
    this.sessionState = sessionState;
    this.streamProcessor = streamProcessor;
    this.promptAssembler = promptAssembler;
    this.toolRegistry = toolRegistry;
    this.providerTransforms = providerTransforms;
  }

  /**
   * Primary orchestration method - ALL conversations flow through this
   * Implements OpenCode's comprehensive session management patterns
   */
  async chat(input: ChatInput): Promise<ChatResponse> {
    // 1. Handle session revert cleanup
    const session = await this.sessionState.getSession(input.sessionID);
    if (session.revert) {
      await this.handleRevertCleanup(session);
    }

    // 2. Create user message
    const userMessage = this.createUserMessage(input);
    const processedParts = await this.processInputParts(input.parts, userMessage);

    // 3. Session locking and queuing
    if (await this.sessionState.isLocked(input.sessionID)) {
      return this.queueRequest(input);
    }

    // 4. Auto-compression check
    if (await this.needsCompression(input.sessionID, input.providerID, input.modelID)) {
      await this.compressSession(input.sessionID, input.providerID, input.modelID);
      return this.chat(input); // Recursive call after compression
    }

    // 5. Lock session
    using sessionLock = await this.sessionState.lock(input.sessionID);

    // 6. Assemble system prompts
    const systemPrompts = await this.promptAssembler.assemble(
      input.providerID,
      input.modelID,
      {
        mode: input.mode,
        customSystem: input.system,
        projectRoot: this.config.workspace.projectRoot
      }
    );

    // 7. Create assistant message
    const assistantMessage = this.createAssistantMessage(input);

    // 8. Prepare tools with dynamic filtering
    const tools = await this.toolRegistry.getToolsForProvider(
      input.providerID,
      input.modelID,
      this.config.tools.permissions
    );

    // 9. Build conversation context
    const conversationHistory = await this.buildConversationContext(
      input.sessionID,
      userMessage,
      processedParts
    );

    // 10. Create provider stream
    const stream = await this.createProviderStream(
      input,
      systemPrompts,
      conversationHistory,
      tools
    );

    // 11. Process stream with event coordination
    return this.streamProcessor.process(stream, assistantMessage, tools);
  }

  /**
   * Streaming version of chat method
   */
  async chatStream(input: ChatInput): Promise<AsyncIterable<StreamEvent>> {
    // Similar setup to chat() but returns the stream directly
    const session = await this.sessionState.getSession(input.sessionID);
    if (session.revert) {
      await this.handleRevertCleanup(session);
    }

    const userMessage = this.createUserMessage(input);
    const processedParts = await this.processInputParts(input.parts, userMessage);

    if (await this.sessionState.isLocked(input.sessionID)) {
      throw new Error('Session is locked, cannot start stream');
    }

    if (await this.needsCompression(input.sessionID, input.providerID, input.modelID)) {
      await this.compressSession(input.sessionID, input.providerID, input.modelID);
      return this.chatStream(input);
    }

    using sessionLock = await this.sessionState.lock(input.sessionID);

    const systemPrompts = await this.promptAssembler.assemble(
      input.providerID,
      input.modelID,
      {
        mode: input.mode,
        customSystem: input.system,
        projectRoot: this.config.workspace.projectRoot
      }
    );

    const tools = await this.toolRegistry.getToolsForProvider(
      input.providerID,
      input.modelID,
      this.config.tools.permissions
    );

    const conversationHistory = await this.buildConversationContext(
      input.sessionID,
      userMessage,
      processedParts
    );

    return this.createProviderStream(input, systemPrompts, conversationHistory, tools);
  }

  private async handleRevertCleanup(session: SessionInfo): Promise<void> {
    if (!session.revert) return;

    // Remove messages after revert point
    await this.sessionState.removeMessagesAfter(
      session.id,
      session.revert.messageID,
      session.revert.partID
    );

    // Revert file system changes if snapshot exists
    if (session.revert.snapshot) {
      await this.revertFileSystemChanges(session.revert.snapshot);
    }

    // Clear revert state
    await this.sessionState.updateSession(session.id, { revert: undefined });
  }

  private createUserMessage(input: ChatInput): MessageInfo {
    const messageID = input.messageID || generateId('message');
    
    return {
      id: messageID,
      role: 'user',
      sessionID: input.sessionID,
      time: { created: Date.now() }
    };
  }

  private createAssistantMessage(input: ChatInput): MessageInfo {
    return {
      id: generateId('message'),
      role: 'assistant',
      sessionID: input.sessionID,
      time: { created: Date.now() },
      cost: 0,
      tokens: {
        input: 0,
        output: 0,
        cache: { read: 0, write: 0 }
      }
    };
  }

  private async processInputParts(parts: any[], userMessage: MessageInfo): Promise<MessagePart[]> {
    // Process input parts (files, text, synthetic content)
    const processedParts: MessagePart[] = [];
    
    for (const part of parts) {
      if (part.type === 'text') {
        processedParts.push({
          id: generateId('part'),
          messageID: userMessage.id,
          sessionID: userMessage.sessionID,
          type: 'text',
          text: part.text
        });
      } else if (part.type === 'file') {
        processedParts.push({
          id: generateId('part'),
          messageID: userMessage.id,
          sessionID: userMessage.sessionID,
          type: 'file',
          url: part.url,
          mime: part.mime,
          filename: part.filename,
          source: part.source
        });
      }
    }

    return processedParts;
  }

  private async queueRequest(input: ChatInput): Promise<ChatResponse> {
    return new Promise((resolve, reject) => {
      this.sessionState.queueRequest(input.sessionID, {
        resolve,
        reject,
        input
      });
    });
  }

  private async needsCompression(sessionID: string, providerID: string, modelID: string): Promise<boolean> {
    const messages = await this.sessionState.getMessages(sessionID);
    const lastAssistant = messages.filter(m => m.info.role === 'assistant').pop();
    
    if (!lastAssistant?.info.tokens) return false;

    const totalTokens = 
      lastAssistant.info.tokens.input +
      lastAssistant.info.tokens.output +
      lastAssistant.info.tokens.cache.read +
      lastAssistant.info.tokens.cache.write;

    const capabilities = this.providerTransforms.getModelCapabilities(providerID, modelID);
    const threshold = this.config.session.compressionThreshold;
    const outputReserve = this.config.session.outputReserve;

    return totalTokens > (capabilities.maxContextLength - outputReserve) * threshold;
  }

  private async compressSession(sessionID: string, providerID: string, modelID: string): Promise<void> {
    await this.sessionState.compress(sessionID);
  }

  private async buildConversationContext(
    sessionID: string,
    userMessage: MessageInfo,
    processedParts: MessagePart[]
  ): Promise<ModelMessage[]> {
    const messages = await this.sessionState.getMessages(sessionID);
    
    // Add current user message
    const currentMessage: StoredMessage = {
      info: userMessage,
      parts: processedParts
    };
    
    // Convert all messages to model format
    return this.convertToModelMessages([...messages, currentMessage]);
  }

  private convertToModelMessages(messages: StoredMessage[]): ModelMessage[] {
    return messages.map(msg => {
      if (msg.info.role === 'user') {
        const content = msg.parts
          .filter(p => p.type === 'text' || p.type === 'file')
          .map(p => {
            if (p.type === 'text') {
              return { type: 'text' as const, text: p.text };
            } else if (p.type === 'file') {
              return { type: 'image' as const, image: p.url };
            }
          })
          .filter(Boolean);

        return {
          role: 'user' as const,
          content: content.length === 1 && content[0]?.type === 'text' 
            ? content[0].text 
            : content
        };
      } else {
        // Assistant message
        const textParts = msg.parts.filter(p => p.type === 'text') as any[];
        const toolParts = msg.parts.filter(p => p.type === 'tool') as any[];
        
        const content: any[] = [];
        
        // Add text content
        if (textParts.length > 0) {
          content.push({
            type: 'text',
            text: textParts.map(p => p.text).join('')
          });
        }

        // Add tool calls and results
        toolParts.forEach(toolPart => {
          if (toolPart.state.status === 'completed') {
            content.push({
              type: 'tool-call',
              toolCallId: toolPart.callID,
              toolName: toolPart.tool,
              args: toolPart.state.input
            });
            content.push({
              type: 'tool-result',
              toolCallId: toolPart.callID,
              result: toolPart.state.output
            });
          }
        });

        return {
          role: 'assistant' as const,
          content: content.length === 1 && content[0]?.type === 'text'
            ? content[0].text
            : content
        };
      }
    });
  }

  private async createProviderStream(
    input: ChatInput,
    systemPrompts: string[],
    conversationHistory: ModelMessage[],
    tools: ProviderTool[]
  ): Promise<AsyncIterable<StreamEvent>> {
    // Apply provider-specific message transformations
    const transformedMessages = this.providerTransforms.transformMessages(
      conversationHistory,
      input.providerID,
      input.modelID
    );

    // Build final message array with system prompts
    const messages: ModelMessage[] = [
      ...systemPrompts.map(content => ({ 
        role: 'system' as const, 
        content 
      })),
      ...transformedMessages
    ];

    // Get optimal parameters
    const params = this.providerTransforms.getOptimalParameters(input.providerID, input.modelID);

    // For now, return a mock stream - this would integrate with actual providers
    return this.createMockStream(messages, tools, params);
  }

  private async* createMockStream(
    messages: ModelMessage[], 
    tools: ProviderTool[], 
    params: any
  ): AsyncIterable<StreamEvent> {
    // Mock implementation for development
    yield { type: 'start' };
    yield { type: 'text-start' };
    yield { type: 'text-delta', text: 'This is a mock response from the orchestrator.' };
    yield { type: 'text-end' };
    yield { 
      type: 'finish', 
      usage: { input: 100, output: 50, cache: { read: 0, write: 0 } },
      finishReason: 'stop'
    };
  }

  private async revertFileSystemChanges(snapshotId: string): Promise<void> {
    // This would integrate with a file system snapshot system
    console.log(`Reverting file system changes from snapshot: ${snapshotId}`);
  }

  // Public methods for session management
  async getSession(sessionId: string): Promise<SessionInfo> {
    return this.sessionState.getSession(sessionId);
  }

  async revert(sessionId: string, messageId: string, partId?: string): Promise<void> {
    return this.sessionState.revert(sessionId, messageId, partId);
  }

  async compress(sessionId: string): Promise<void> {
    return this.sessionState.compress(sessionId);
  }

  async getTools(providerId: string, modelId: string): Promise<ProviderTool[]> {
    return this.toolRegistry.getToolsForProvider(
      providerId,
      modelId,
      this.config.tools.permissions
    );
  }
}