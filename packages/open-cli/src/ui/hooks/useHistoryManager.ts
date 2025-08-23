/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback } from 'react';
import { MessageContent, UIMessage } from '../message.js';

// Type for the updater function passed to updateMessage
type MessageUpdater = (
  prevMessage: MessageContent,
) => Partial<MessageContent>;

export interface UseHistoryManagerReturn {
  history: MessageContent[];
  addItem: (message: MessageContent, baseTimestamp: number) => string; // Returns the generated ID
  updateItem: (
    id: string,
    updates: Partial<MessageContent> | MessageUpdater,
  ) => void;
  clearItems: () => void;
  loadHistory: (newHistory: MessageContent[]) => void;
}

/**
 * Custom hook to manage the chat message history state.
 * Updated to use OpenCode-style MessageContent types with string IDs.
 */
export function useHistory(): UseHistoryManagerReturn {
  const [history, setHistory] = useState<MessageContent[]>([]);
  const messageIdCounterRef = useRef(0);

  // Generates a unique message ID - OpenCode style string IDs
  const getNextMessageId = useCallback((baseTimestamp: number): string => {
    messageIdCounterRef.current += 1;
    return `${baseTimestamp}-${messageIdCounterRef.current}`;
  }, []);

  const loadHistory = useCallback((newHistory: MessageContent[]) => {
    setHistory(newHistory);
  }, []);

  // Adds a new message to the history state - now expects full MessageContent
  const addItem = useCallback(
    (message: MessageContent, baseTimestamp: number): string => {
      // Update the message ID if not already set
      const messageWithId = { ...message, id: message.id || getNextMessageId(baseTimestamp) };

      setHistory((prevHistory) => {
        if (prevHistory.length > 0) {
          const lastMessage = prevHistory[prevHistory.length - 1];
          // Prevent adding duplicate consecutive user text messages
          if (
            lastMessage.type === 'text' &&
            messageWithId.type === 'text' &&
            lastMessage.role === 'user' &&
            messageWithId.role === 'user' &&
            lastMessage.text === messageWithId.text
          ) {
            return prevHistory; // Don't add the duplicate
          }
        }
        return [...prevHistory, messageWithId];
      });
      return messageWithId.id;
    },
    [getNextMessageId],
  );

  /**
   * Updates an existing message identified by its ID.
   * @deprecated Prefer not to update messages directly as we are currently
   * rendering all messages in <Static /> for performance reasons. Only use
   * if ABSOLUTELY NECESSARY
   */
  const updateItem = useCallback(
    (
      id: string,
      updates: Partial<MessageContent> | MessageUpdater,
    ) => {
      setHistory((prevHistory) =>
        prevHistory.map((message) => {
          if (message.id === id) {
            // Apply updates based on whether it's an object or a function
            const newUpdates =
              typeof updates === 'function' ? updates(message) : updates;
            return { ...message, ...newUpdates } as MessageContent;
          }
          return message;
        }),
      );
    },
    [],
  );

  // Clears the entire history state and resets the ID counter.
  const clearItems = useCallback(() => {
    setHistory([]);
    messageIdCounterRef.current = 0;
  }, []);

  return {
    history,
    addItem,
    updateItem,
    clearItems,
    loadHistory,
  };
}
