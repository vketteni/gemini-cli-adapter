/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SessionInfo,
  SessionLock,
  QueuedRequest,
  StoredMessage,
  RevertInfo,
  TokenUsage
} from '../types/index.js';
import { generateId } from '../utils/identifiers.js';

/**
 * Session State Manager - OpenCode-inspired session state management
 * 
 * Handles all session-related state operations including:
 * - Session creation and management
 * - Message storage and retrieval
 * - Session locking and queuing
 * - Conversation compression
 * - Revert functionality
 */
export class SessionStateManager {
  private sessions = new Map<string, SessionInfo>();
  private messages = new Map<string, StoredMessage[]>();
  private locks = new Map<string, AbortController>();
  private queues = new Map<string, QueuedRequest[]>();

  /**
   * Get or create a session
   */
  async getSession(sessionId: string): Promise<SessionInfo> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  /**
   * Get all messages for a session
   */
  async getMessages(sessionId: string): Promise<StoredMessage[]> {
    return this.messages.get(sessionId) || [];
  }

  /**
   * Check if session is locked
   */
  async isLocked(sessionId: string): Promise<boolean> {
    return this.locks.has(sessionId);
  }

  /**
   * Lock a session for exclusive access
   */
  async lock(sessionId: string): Promise<SessionLock> {
    if (this.locks.has(sessionId)) {
      throw new SessionBusyError(sessionId);
    }

    const controller = new AbortController();
    this.locks.set(sessionId, controller);

    return {
      signal: controller.signal,
      [Symbol.dispose]: () => {
        this.locks.delete(sessionId);
        this.processQueue(sessionId);
      }
    };
  }

  /**
   * Add a message to session history
   */
  async addMessage(message: StoredMessage): Promise<void> {
    const messages = this.messages.get(message.info.sessionID) || [];
    messages.push(message);
    this.messages.set(message.info.sessionID, messages);
    
    // Update session timestamp
    const session = await this.getSession(message.info.sessionID);
    session.updated = Date.now();
    if (message.info.tokens) {
      session.tokens = message.info.tokens;
    }
  }

  /**
   * Update session metadata
   */
  async updateSession(sessionId: string, updates: Partial<SessionInfo>): Promise<SessionInfo> {
    const session = await this.getSession(sessionId);
    Object.assign(session, updates);
    session.updated = Date.now();
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Queue a request when session is locked
   */
  queueRequest(sessionId: string, request: QueuedRequest): void {
    const queue = this.queues.get(sessionId) || [];
    queue.push(request);
    this.queues.set(sessionId, queue);
  }

  /**
   * Process queued requests for a session
   */
  private processQueue(sessionId: string): void {
    const queue = this.queues.get(sessionId);
    if (!queue || queue.length === 0) return;

    const nextRequest = queue.shift()!;
    this.queues.set(sessionId, queue);

    // Process the next request asynchronously
    setImmediate(async () => {
      try {
        // This would typically call back to the orchestrator
        // For now, we'll reject with a message to implement proper callback
        nextRequest.reject(new Error('Queue processing not implemented - need orchestrator callback'));
      } catch (error) {
        nextRequest.reject(error);
      }
    });
  }

  /**
   * Revert session to a specific message/part
   */
  async revert(sessionId: string, messageId: string, partId?: string): Promise<void> {
    const messages = this.messages.get(sessionId) || [];
    const revertIndex = messages.findIndex(m => 
      m.info.id === messageId && (!partId || m.parts.some(p => p.id === partId))
    );
    
    if (revertIndex >= 0) {
      // Create revert snapshot
      const revertedMessages = messages.splice(revertIndex);
      const session = await this.getSession(sessionId);
      
      session.revert = {
        sessionID: sessionId,
        messageID: messageId,
        partID: partId,
        timestamp: Date.now(),
        preRevertSnapshot: await this.createSnapshot(),
        revertedMessageCount: revertedMessages.length,
        revertedFileChanges: this.countFileChanges(revertedMessages)
      };
      
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Remove messages after a specific point
   */
  async removeMessagesAfter(sessionId: string, messageId: string, partId?: string): Promise<void> {
    const messages = this.messages.get(sessionId) || [];
    const removeIndex = messages.findIndex(m => 
      m.info.id === messageId && (!partId || m.parts.some(p => p.id === partId))
    );
    
    if (removeIndex >= 0) {
      messages.splice(removeIndex);
      this.messages.set(sessionId, messages);
    }
  }

  /**
   * Compress session conversation history
   */
  async compress(sessionId: string): Promise<void> {
    const messages = this.messages.get(sessionId) || [];
    const threshold = 0.3; // Keep last 30% of conversation (from config)
    const keepCount = Math.floor(messages.length * threshold);
    
    if (keepCount < messages.length) {
      const compressedMessages = messages.slice(-keepCount);
      
      // Create compression summary (mock implementation)
      const compressionSummary = await this.createCompressionSummary(
        messages.slice(0, -keepCount)
      );
      
      // Replace old messages with summary + recent messages
      this.messages.set(sessionId, [compressionSummary, ...compressedMessages]);
      
      const session = await this.getSession(sessionId);
      session.compressed = true;
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Create a new session
   */
  private createSession(sessionId: string): SessionInfo {
    return {
      id: sessionId,
      created: Date.now(),
      updated: Date.now(),
      providerID: 'unknown',
      modelID: 'unknown',
      compressed: false
    };
  }

  /**
   * Create a snapshot for revert functionality
   */
  private async createSnapshot(): Promise<string> {
    // Mock implementation - would integrate with file system snapshot system
    return generateId('snapshot');
  }

  /**
   * Count file changes in messages for revert tracking
   */
  private countFileChanges(messages: StoredMessage[]): number {
    return messages.reduce((count, message) => {
      return count + message.parts.filter(p => 
        p.type === 'tool' && 
        ['edit', 'write', 'create'].includes((p as any).tool)
      ).length;
    }, 0);
  }

  /**
   * Create compression summary from old messages
   */
  private async createCompressionSummary(oldMessages: StoredMessage[]): Promise<StoredMessage> {
    // Mock implementation - would use AI to create summary
    const summaryText = `[Compressed conversation summary: ${oldMessages.length} messages from ${new Date(oldMessages[0]?.info.time.created || 0).toISOString()} to ${new Date(oldMessages[oldMessages.length - 1]?.info.time.created || 0).toISOString()}]`;
    
    return {
      info: {
        id: generateId('message'),
        role: 'assistant',
        sessionID: oldMessages[0]?.info.sessionID || 'unknown',
        time: { created: Date.now() },
        cost: 0,
        tokens: { input: 0, output: 0, cache: { read: 0, write: 0 } }
      },
      parts: [{
        id: generateId('part'),
        messageID: generateId('message'),
        sessionID: oldMessages[0]?.info.sessionID || 'unknown',
        type: 'text',
        text: summaryText,
        synthetic: true
      }]
    };
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    // Clean up any active locks
    for (const controller of this.locks.values()) {
      controller.abort();
    }
    this.locks.clear();
    
    // Reject any queued requests
    for (const queue of this.queues.values()) {
      for (const request of queue) {
        request.reject(new Error('Session state manager disposed'));
      }
    }
    this.queues.clear();
  }
}

/**
 * Custom error for session busy state
 */
export class SessionBusyError extends Error {
  constructor(sessionId: string) {
    super(`Session ${sessionId} is currently busy`);
    this.name = 'SessionBusyError';
  }
}