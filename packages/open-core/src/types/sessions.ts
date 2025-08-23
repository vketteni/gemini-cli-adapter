/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Session Management Types
export interface SessionInfo {
  id: string;
  created: number;
  updated: number;
  title?: string;
  providerID: string;
  modelID: string;
  compressed: boolean;
  tokens?: TokenUsage;
  revert?: RevertInfo;
}


export interface RevertInfo {
  sessionID: string;
  messageID: string;
  partID?: string;
  snapshot?: string;
  diff?: string;
  timestamp: number;
  preRevertSnapshot: string;
  revertedMessageCount: number;
  revertedFileChanges: number;
}

export interface SessionLock {
  signal: AbortSignal;
  [Symbol.dispose](): void;
}

export interface QueuedRequest {
  resolve: (value: ChatResponse) => void;
  reject: (error: Error) => void;
  input: ChatInput;
}

// Configuration Types
export interface SessionConfig {
  compressionThreshold: number;
  preserveThreshold: number;
  maxTurns: number;
  outputReserve: number;
  enableLocking: boolean;
  enableQueuing: boolean;
  enableRevert: boolean;
}

// Chat Input/Output Types
export interface ChatInput {
  sessionID: string;
  messageID?: string;
  parts: InputPart[];
  providerID: string;
  modelID: string;
  system?: string;
  mode?: 'chat' | 'plan';
  tools?: Record<string, boolean>;
}

export type InputPart = TextInputPart | FileInputPart;

export interface TextInputPart {
  type: 'text';
  text: string;
}

export interface FileInputPart {
  type: 'file';
  url: string;
  mime: string;
  filename: string;
  source?: string;
}

// Import and re-export message types from messages.ts
import type { 
  MessageInfo, 
  MessagePart, 
  TokenUsage 
} from './messages.js';

export type { MessageInfo, MessagePart, TokenUsage };

export interface ChatResponse {
  info: MessageInfo;
  parts: MessagePart[];
}