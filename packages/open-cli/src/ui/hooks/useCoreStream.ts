/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Core, type ChatInput, type StreamEvent } from '@open-cli/core';
import { 
  MessageContent, 
  StreamingState, 
  SlashCommandResult, 
  UIMessage 
} from '../message.js';
import { UseHistoryManagerReturn } from './useHistoryManager.js';

export interface UseCoreStreamReturn {
  streamingState: StreamingState;
  submitQuery: (input: string) => Promise<void>;
  initError: string | null;
  pendingMessages: MessageContent[];
  thought?: string;
}

/**
 * Simplified Core-based streaming hook
 * Replaces the complex adapter-based useGeminiStream with direct Core interface
 */
export const useCoreStream = (
  core: Core,
  history: MessageContent[],
  addMessage: UseHistoryManagerReturn['addItem'],
  selectedProvider: string,
  selectedModel: string,
  onDebugMessage: (message: string) => void,
  handleSlashCommand: (cmd: string) => Promise<SlashCommandResult | false>
): UseCoreStreamReturn => {
  const [streamingState, setStreamingState] = useState<StreamingState>('idle');
  const [initError, setInitError] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<MessageContent[]>([]);
  const [thought, setThought] = useState<string>();
  
  const sessionId = useRef<string>('main-session');
  const currentMessageRef = useRef<MessageContent | null>(null);
  const toolCallsRef = useRef<Map<string, any>>(new Map());

  const submitQuery = useCallback(async (input: string) => {
    try {
      setStreamingState('responding');
      setInitError(null);
      setPendingMessages([]);
      
      // Handle slash commands first
      if (input.startsWith('/')) {
        const result = await handleSlashCommand(input);
        if (result !== false) {
          setStreamingState('idle');
          return;
        }
      }

      // Add user message to history
      const userMessage = UIMessage.TextContent.parse({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'text',
        text: input,
        role: 'user',
      });
      addMessage(userMessage, Date.now());

      // Create assistant message placeholder
      const assistantMessage = UIMessage.TextContent.parse({
        id: (Date.now() + 1).toString(),
        timestamp: Date.now(),
        type: 'text',
        text: '',
        role: 'assistant',
      });
      currentMessageRef.current = assistantMessage;
      setPendingMessages([assistantMessage]);

      // Build Core chat input
      const chatInput: ChatInput = {
        sessionID: sessionId.current,
        parts: [{ type: 'text', text: input }],
        providerID: selectedProvider,
        modelID: selectedModel,
      };

      // Start streaming
      setStreamingState('responding');
      const stream = await core.chatStream(chatInput);
      
      // Process stream events
      for await (const event of stream) {
        await handleStreamEvent(event);
      }
      
      // Finalize message
      if (currentMessageRef.current) {
        addMessage(currentMessageRef.current, Date.now());
        setPendingMessages([]);
        currentMessageRef.current = null;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setInitError(errorMessage);
      
      const errorMsg = UIMessage.ErrorContent.parse({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'error',
        message: `Error: ${errorMessage}`,
        details: error instanceof Error ? error.stack : undefined,
      });
      addMessage(errorMsg, Date.now());
      
    } finally {
      setStreamingState('idle');
    }
  }, [core, selectedProvider, selectedModel, handleSlashCommand, addMessage]);

  const handleStreamEvent = useCallback(async (event: StreamEvent) => {
    switch (event.type) {
      case 'start':
        setStreamingState('responding');
        break;

      case 'text-start':
        // Begin text generation
        break;

      case 'text-delta':
        // Update current message with new text
        if (currentMessageRef.current && currentMessageRef.current.type === 'text' && event.text) {
          currentMessageRef.current.text += event.text;
          setPendingMessages([{ ...currentMessageRef.current }]);
        }
        break;

      case 'text-end':
        // Text generation complete
        break;

      case 'tool-call':
        // Handle tool call start
        const toolCall = {
          id: event.toolCallId,
          name: event.toolName || 'unknown',
          args: event.input,
          status: 'running' as const,
          startTime: Date.now(),
        };
        toolCallsRef.current.set(event.toolCallId, toolCall);
        
        // Add tool call to pending messages
        const toolCallMessage = UIMessage.ToolCallContent.parse({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'tool-call',
          toolName: event.toolName || 'unknown',
          toolId: event.toolCallId,
          status: 'running',
        });
        setPendingMessages(prev => [...prev, toolCallMessage]);
        break;

      case 'tool-result':
        // Handle tool call completion
        const completedTool = toolCallsRef.current.get(event.toolCallId);
        if (completedTool) {
          completedTool.status = 'completed';
          completedTool.result = event.output;
          completedTool.endTime = Date.now();
          
          const toolResultMessage = UIMessage.ToolResultContent.parse({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'tool-result',
            toolName: completedTool.name,
            toolId: event.toolCallId,
            result: event.output || '',
            success: true,
          });
          setPendingMessages(prev => [...prev, toolResultMessage]);
        }
        break;

      case 'error':
        const errorMessage = UIMessage.ErrorContent.parse({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'error',
          message: `Stream error: ${event.error}`,
        });
        setPendingMessages(prev => [...prev, errorMessage]);
        setInitError(String(event.error));
        break;

      case 'finish':
        // Stream completed
        setStreamingState('idle');
        break;

      default:
        // Handle unknown event types
        onDebugMessage(`Unknown stream event: ${event.type}`);
        break;
    }
  }, [onDebugMessage]);

  // Initialize Core and validate providers on mount
  useEffect(() => {
    const initializeCore = async () => {
      try {
        // Validate that selected provider is available
        const availableProviders = await core.getAvailableProviders();
        if (!availableProviders.includes(selectedProvider)) {
          setInitError(`Provider "${selectedProvider}" is not available. Available providers: ${availableProviders.join(', ')}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setInitError(`Core initialization failed: ${errorMessage}`);
      }
    };

    initializeCore();
  }, [core, selectedProvider]);

  return {
    streamingState,
    submitQuery,
    initError,
    pendingMessages,
    thought,
  };
};