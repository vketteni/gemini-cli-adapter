/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Core, type ChatInput, type StreamEvent } from '@open-cli/core';
import {
  StreamingState,
  HistoryItem,
  MessageType,
  SlashCommandProcessorResult,
} from '../types.js';
import { UseHistoryManagerReturn } from './useHistoryManager.js';

export interface UseCoreStreamReturn {
  streamingState: StreamingState;
  submitQuery: (input: string) => Promise<void>;
  initError: string | null;
  pendingHistoryItems: HistoryItem[];
  thought?: string;
}

/**
 * Simplified Core-based streaming hook
 * Replaces the complex adapter-based useGeminiStream with direct Core interface
 */
export const useCoreStream = (
  core: Core,
  history: HistoryItem[],
  addItem: UseHistoryManagerReturn['addItem'],
  selectedProvider: string,
  selectedModel: string,
  onDebugMessage: (message: string) => void,
  handleSlashCommand: (cmd: string) => Promise<SlashCommandProcessorResult | false>
): UseCoreStreamReturn => {
  const [streamingState, setStreamingState] = useState<StreamingState>(StreamingState.Idle);
  const [initError, setInitError] = useState<string | null>(null);
  const [pendingHistoryItems, setPendingHistoryItems] = useState<HistoryItem[]>([]);
  const [thought, setThought] = useState<string>();
  
  const sessionId = useRef<string>('main-session');
  const currentMessageRef = useRef<HistoryItem | null>(null);
  const toolCallsRef = useRef<Map<string, any>>(new Map());

  const submitQuery = useCallback(async (input: string) => {
    try {
      setStreamingState(StreamingState.WaitingForResponse);
      setInitError(null);
      setPendingHistoryItems([]);
      
      // Handle slash commands first
      if (input.startsWith('/')) {
        const result = await handleSlashCommand(input);
        if (result !== false) {
          setStreamingState(StreamingState.Idle);
          return;
        }
      }

      // Add user message to history
      const userMessage: HistoryItem = {
        id: Date.now(),
        type: MessageType.USER,
        text: input,
        timestamp: Date.now(),
      };
      addItem(userMessage, Date.now());

      // Create assistant message placeholder
      const assistantMessage: HistoryItem = {
        id: Date.now() + 1,
        type: MessageType.ASSISTANT,
        text: '',
        timestamp: Date.now(),
      };
      currentMessageRef.current = assistantMessage;
      setPendingHistoryItems([assistantMessage]);

      // Build Core chat input
      const chatInput: ChatInput = {
        sessionID: sessionId.current,
        parts: [{ type: 'text', text: input }],
        providerID: selectedProvider,
        modelID: selectedModel,
      };

      // Start streaming
      setStreamingState(StreamingState.Responding);
      const stream = await core.chatStream(chatInput);
      
      // Process stream events
      for await (const event of stream) {
        await handleStreamEvent(event);
      }
      
      // Finalize message
      if (currentMessageRef.current) {
        addItem(currentMessageRef.current, Date.now());
        setPendingHistoryItems([]);
        currentMessageRef.current = null;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setInitError(errorMessage);
      
      const errorHistoryItem: HistoryItem = {
        id: Date.now(),
        type: MessageType.ERROR,
        text: `Error: ${errorMessage}`,
        timestamp: Date.now(),
      };
      addItem(errorHistoryItem, Date.now());
      
    } finally {
      setStreamingState(StreamingState.Idle);
    }
  }, [core, selectedProvider, selectedModel, handleSlashCommand, addItem]);

  const handleStreamEvent = useCallback(async (event: StreamEvent) => {
    switch (event.type) {
      case 'start':
        setStreamingState(StreamingState.Responding);
        break;

      case 'text-start':
        // Begin text generation
        break;

      case 'text-delta':
        // Update current message with new text
        if (currentMessageRef.current) {
          currentMessageRef.current.text += event.text;
          setPendingHistoryItems([{ ...currentMessageRef.current }]);
        }
        break;

      case 'text-end':
        // Text generation complete
        break;

      case 'tool-call':
        // Handle tool call start
        const toolCall = {
          id: event.id,
          name: event.toolName,
          args: event.args,
          status: 'running' as const,
          startTime: Date.now(),
        };
        toolCallsRef.current.set(event.id, toolCall);
        
        // Add tool call to pending items
        const toolCallItem: HistoryItem = {
          id: Date.now(),
          type: MessageType.TOOL_CALL,
          text: `🔧 Calling ${event.toolName}...`,
          timestamp: Date.now(),
        };
        setPendingHistoryItems(prev => [...prev, toolCallItem]);
        break;

      case 'tool-result':
        // Handle tool call completion
        const completedTool = toolCallsRef.current.get(event.id);
        if (completedTool) {
          completedTool.status = 'completed';
          completedTool.result = event.result;
          completedTool.endTime = Date.now();
          
          const toolResultItem: HistoryItem = {
            id: Date.now(),
            type: MessageType.TOOL_RESULT,
            text: `✅ ${completedTool.name} completed`,
            timestamp: Date.now(),
          };
          setPendingHistoryItems(prev => [...prev, toolResultItem]);
        }
        break;

      case 'error':
        const errorItem: HistoryItem = {
          id: Date.now(),
          type: MessageType.ERROR,
          text: `Error: ${event.error}`,
          timestamp: Date.now(),
        };
        setPendingHistoryItems(prev => [...prev, errorItem]);
        setInitError(String(event.error));
        break;

      case 'finish':
        // Stream completed
        setStreamingState(StreamingState.Idle);
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
    pendingHistoryItems,
    thought,
  };
};