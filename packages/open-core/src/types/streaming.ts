/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TokenUsage } from './sessions.js';

// Streaming Event Types (OpenCode-inspired)
export type StreamEvent =
  | StreamStartEvent
  | StreamTextEvent
  | StreamToolEvent
  | StreamStepEvent
  | StreamFinishEvent
  | StreamErrorEvent;

export interface StreamStartEvent {
  type: 'start';
}

export interface StreamTextEvent {
  type: 'text-delta' | 'text-start' | 'text-end';
  text?: string;
}

export interface StreamToolEvent {
  type: 'tool-call' | 'tool-result' | 'tool-error';
  toolCallId: string;
  toolName?: string;
  input?: any;
  output?: any;
  metadata?: any;
  error?: Error;
  title?: string;
}

export interface StreamStepEvent {
  type: 'start-step' | 'finish-step';
  usage?: TokenUsage;
  metadata?: any;
}

export interface StreamFinishEvent {
  type: 'finish';
  usage?: TokenUsage;
  finishReason?: string;
}

export interface StreamErrorEvent {
  type: 'error';
  error: Error;
}

// Event Bus Types
export interface EventBusEvent {
  sessionId: string;
  messageId: string;
  event: StreamEvent;
}

export type EventListener<T = EventBusEvent> = (event: T) => void;

export interface EventBus {
  emit<T = EventBusEvent>(eventName: string, event: T): void;
  on<T = EventBusEvent>(eventName: string, listener: EventListener<T>): void;
  off<T = EventBusEvent>(eventName: string, listener: EventListener<T>): void;
}