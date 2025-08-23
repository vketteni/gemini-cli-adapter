/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  StreamEvent,
  MessageInfo,
  MessagePart,
  TextPart,
  ToolPart,
  StepStartPart,
  StepFinishPart,
  ChatResponse,
  StoredMessage,
  ProviderTool,
  EventBus,
  StreamToolEvent,
  StreamTextEvent,
  StreamStepEvent,
  StreamFinishEvent
} from '../types/index.js';
import { SessionStateManager } from '../state/SessionStateManager.js';
import { generateId } from '../utils/identifiers.js';

/**
 * Stream Event Processor - OpenCode-inspired event-driven streaming architecture
 * 
 * Processes AI model streams through a comprehensive event system that handles
 * different types of streaming events (text, tool calls, errors) in a unified way.
 * 
 * Key responsibilities:
 * - Process streaming events in real-time
 * - Coordinate tool execution states
 * - Update UI through event bus
 * - Track token usage and costs
 * - Handle errors gracefully
 */
export class StreamEventProcessor {
  constructor(
    private sessionState: SessionStateManager,
    private eventBus?: EventBus
  ) {}

  /**
   * Process a stream of events and coordinate all activity
   */
  async process(
    stream: AsyncIterable<StreamEvent>,
    assistantMessage: MessageInfo,
    availableTools: ProviderTool[]
  ): Promise<ChatResponse> {
    const toolCalls = new Map<string, ToolPart>();
    const parts: MessagePart[] = [];
    let currentTextPart: TextPart | undefined;

    try {
      for await (const event of stream) {
        switch (event.type) {
          case 'start':
            await this.handleStart(assistantMessage);
            break;

          case 'text-start':
            currentTextPart = await this.handleTextStart(assistantMessage);
            break;

          case 'text-delta':
            currentTextPart = await this.handleTextDelta(
              event, 
              currentTextPart, 
              assistantMessage, 
              parts
            );
            break;

          case 'text-end':
            if (currentTextPart) {
              parts.push(currentTextPart);
              currentTextPart = undefined;
            }
            break;

          case 'tool-call':
            await this.handleToolCall(event, toolCalls, assistantMessage);
            break;

          case 'tool-result':
            await this.handleToolResult(event, toolCalls, parts);
            break;

          case 'tool-error':
            await this.handleToolError(event, toolCalls, parts);
            break;

          case 'start-step':
            parts.push(await this.createStepStartPart(assistantMessage));
            break;

          case 'finish-step':
            await this.handleFinishStep(event, assistantMessage, parts);
            break;

          case 'finish':
            await this.handleFinish(event, assistantMessage);
            break;

          case 'error':
            throw event.error;
        }

        // Emit real-time updates to UI layer
        this.emitStreamEvent(assistantMessage, event);
      }
    } catch (error) {
      // Handle stream errors
      await this.handleStreamError(error, assistantMessage);
      throw error;
    }

    // Include any remaining text part
    if (currentTextPart) {
      parts.push(currentTextPart);
    }

    // Include all completed tool calls
    for (const toolPart of toolCalls.values()) {
      parts.push(toolPart);
    }

    // Finalize and store message
    const finalMessage: StoredMessage = {
      info: assistantMessage,
      parts
    };

    await this.sessionState.addMessage(finalMessage);

    return {
      info: assistantMessage,
      parts
    };
  }

  private async handleStart(assistantMessage: MessageInfo): Promise<void> {
    // Initialize streaming session
    console.log(`Starting stream for message ${assistantMessage.id}`);
  }

  private async handleTextStart(assistantMessage: MessageInfo): Promise<TextPart> {
    return {
      id: generateId('part'),
      messageID: assistantMessage.id,
      sessionID: assistantMessage.sessionID,
      type: 'text',
      text: ''
    };
  }

  private async handleTextDelta(
    event: StreamTextEvent,
    currentTextPart: TextPart | undefined,
    assistantMessage: MessageInfo,
    parts: MessagePart[]
  ): Promise<TextPart> {
    if (!currentTextPart) {
      currentTextPart = {
        id: generateId('part'),
        messageID: assistantMessage.id,
        sessionID: assistantMessage.sessionID,
        type: 'text',
        text: event.text || ''
      };
    } else {
      currentTextPart.text += event.text || '';
    }

    return currentTextPart;
  }

  private async handleToolCall(
    event: StreamToolEvent,
    toolCalls: Map<string, ToolPart>,
    assistantMessage: MessageInfo
  ): Promise<void> {
    const toolPart: ToolPart = {
      id: generateId('part'),
      messageID: assistantMessage.id,
      sessionID: assistantMessage.sessionID,
      type: 'tool',
      tool: event.toolName || 'unknown',
      callID: event.toolCallId,
      state: {
        status: 'running',
        input: event.input,
        time: { start: Date.now() }
      }
    };

    toolCalls.set(event.toolCallId, toolPart);
  }

  private async handleToolResult(
    event: StreamToolEvent,
    toolCalls: Map<string, ToolPart>,
    parts: MessagePart[]
  ): Promise<void> {
    const toolPart = toolCalls.get(event.toolCallId);
    if (toolPart && toolPart.state.status === 'running') {
      toolPart.state = {
        status: 'completed',
        input: toolPart.state.input,
        output: event.output,
        title: event.title || toolPart.tool || 'Tool execution',
        metadata: event.metadata || {},
        time: {
          start: toolPart.state.time.start,
          end: Date.now()
        }
      };

      // Tool call is complete, will be added to parts at the end
    }
  }

  private async handleToolError(
    event: StreamToolEvent,
    toolCalls: Map<string, ToolPart>,
    parts: MessagePart[]
  ): Promise<void> {
    const toolPart = toolCalls.get(event.toolCallId);
    if (toolPart && toolPart.state.status === 'running') {
      toolPart.state = {
        status: 'error',
        input: toolPart.state.input,
        error: event.error?.message || 'Unknown error',
        time: {
          start: toolPart.state.time.start,
          end: Date.now()
        }
      };

      // Tool call failed, will be added to parts at the end
    }
  }

  private async createStepStartPart(
    assistantMessage: MessageInfo
  ): Promise<StepStartPart> {
    return {
      id: generateId('part'),
      messageID: assistantMessage.id,
      sessionID: assistantMessage.sessionID,
      type: 'step-start'
    };
  }

  private async handleFinishStep(
    event: StreamStepEvent,
    assistantMessage: MessageInfo,
    parts: MessagePart[]
  ): Promise<void> {
    const stepPart: StepFinishPart = {
      id: generateId('part'),
      messageID: assistantMessage.id,
      sessionID: assistantMessage.sessionID,
      type: 'step-finish',
      tokens: event.usage,
      cost: this.calculateCost(event.usage)
    };

    parts.push(stepPart);

    // Update assistant message with usage
    if (event.usage) {
      assistantMessage.tokens = event.usage;
      assistantMessage.cost = (assistantMessage.cost || 0) + (stepPart.cost || 0);
    }
  }

  private async handleFinish(
    event: StreamFinishEvent,
    assistantMessage: MessageInfo
  ): Promise<void> {
    // Final usage update
    if (event.usage) {
      assistantMessage.tokens = event.usage;
      assistantMessage.cost = this.calculateCost(event.usage);
    }

    // Mark completion time
    assistantMessage.time.completed = Date.now();
  }

  private async handleStreamError(error: any, assistantMessage: MessageInfo): Promise<void> {
    console.error(`Stream error for message ${assistantMessage.id}:`, error);
    
    // Update message with error state
    assistantMessage.time.completed = Date.now();
    
    // Could add error part to message parts if needed
  }

  private calculateCost(usage: any): number {
    // Mock cost calculation - would be provider-specific
    if (!usage) return 0;
    
    const inputRate = 0.01 / 1000; // $0.01 per 1K input tokens
    const outputRate = 0.03 / 1000; // $0.03 per 1K output tokens
    
    return (usage.input || 0) * inputRate + (usage.output || 0) * outputRate;
  }

  private emitStreamEvent(assistantMessage: MessageInfo, event: StreamEvent): void {
    if (this.eventBus) {
      this.eventBus.emit('stream-event', {
        sessionId: assistantMessage.sessionID,
        messageId: assistantMessage.id,
        event
      });
    }
  }
}