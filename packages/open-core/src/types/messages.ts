/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Message Types (OpenCode-inspired)
export interface MessageInfo {
  id: string;
  role: 'user' | 'assistant';
  sessionID: string;
  time: {
    created: number;
    updated?: number;
  };
  tokens?: TokenUsage;
  cost?: number;
}

export type MessagePart = TextPart | FilePart | ToolPart | StepPart;

export interface BasePart {
  id: string;
  messageID: string;
  sessionID: string;
  synthetic?: boolean; // Auto-generated content
}

export interface TextPart extends BasePart {
  type: 'text';
  text: string;
}

export interface FilePart extends BasePart {
  type: 'file';
  url: string;
  mime: string;
  filename: string;
  source?: string;
}

export interface ToolPart extends BasePart {
  type: 'tool';
  tool: string;
  callID: string;
  state: ToolCallState;
}

export interface StepPart extends BasePart {
  type: 'step-start' | 'step-finish';
  tokens?: TokenUsage;
  cost?: number;
}

export type ToolCallState = 
  | ToolCallPending
  | ToolCallRunning  
  | ToolCallCompleted
  | ToolCallError;

export interface ToolCallPending {
  status: 'pending';
  time: { created: number };
}

export interface ToolCallRunning {
  status: 'running';
  input: any;
  time: { start: number };
  title?: string;
  metadata?: any;
}

export interface ToolCallCompleted {
  status: 'completed';
  input: any;
  output: any;
  time: { start: number; end: number };
  title?: string;
  metadata?: any;
}

export interface ToolCallError {
  status: 'error';
  input: any;
  error: string;
  time: { start: number; end: number };
}

// Model Message Format
export interface ModelMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ModelMessagePart[];
  providerOptions?: Record<string, any>;
}

export type ModelMessagePart = 
  | { type: 'text'; text: string }
  | { type: 'image'; image: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: any }
  | { type: 'tool-result'; toolCallId: string; result: any };

// Stored Message Format
export interface StoredMessage {
  info: MessageInfo;
  parts: MessagePart[];
}

// Import TokenUsage from sessions to avoid circular dependency
import type { TokenUsage } from './sessions.js';