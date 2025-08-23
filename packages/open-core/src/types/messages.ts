/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Token Usage Types
export interface TokenUsage {
  input: number;
  output: number;
  reasoning?: number;
  cache: {
    read: number;
    write: number;
  };
}

// Message Information Types - Based on OpenCode MessageV2.Info
export interface MessageInfo {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  time: {
    created: number;
    completed?: number;
  };
  // Assistant-specific fields
  system?: string[];
  mode?: string;
  path?: {
    cwd: string;
    root: string;
  };
  cost?: number;
  tokens?: TokenUsage;
  modelID?: string;
  providerID?: string;
  summary?: boolean;
  error?: MessageError;
}

// Message Error Types - Based on OpenCode's error patterns
export interface MessageError {
  name: string;
  message: string;
  cause?: any;
}

// Message Part Types - Based on OpenCode MessageV2.Part union
export type MessagePart = 
  | TextPart 
  | ToolPart 
  | FilePart 
  | StepStartPart 
  | StepFinishPart 
  | PatchPart;

export interface MessagePartBase {
  id: string;
  sessionID: string;
  messageID: string;
}

export interface TextPart extends MessagePartBase {
  type: 'text';
  text: string;
  synthetic?: boolean;
  time?: {
    start: number;
    end?: number;
  };
}

export interface ToolPart extends MessagePartBase {
  type: 'tool';
  callID: string;
  tool: string;
  state: ToolState;
}

export interface FilePart extends MessagePartBase {
  type: 'file';
  mime: string;
  filename?: string;
  url: string;
  source?: FileSource;
}

export interface StepStartPart extends MessagePartBase {
  type: 'step-start';
}

export interface StepFinishPart extends MessagePartBase {
  type: 'step-finish';
  cost: number;
  tokens: TokenUsage;
}

export interface PatchPart extends MessagePartBase {
  type: 'patch';
  hash: string;
  files: string[];
}

// Tool State Types - Based on OpenCode's ToolState union
export type ToolState = 
  | ToolStatePending 
  | ToolStateRunning 
  | ToolStateCompleted 
  | ToolStateError;

export interface ToolStatePending {
  status: 'pending';
}

export interface ToolStateRunning {
  status: 'running';
  input: any;
  title?: string;
  metadata?: Record<string, any>;
  time: {
    start: number;
  };
}

export interface ToolStateCompleted {
  status: 'completed';
  input: Record<string, any>;
  output: string;
  title: string;
  metadata: Record<string, any>;
  time: {
    start: number;
    end: number;
  };
}

export interface ToolStateError {
  status: 'error';
  input: Record<string, any>;
  error: string;
  time: {
    start: number;
    end: number;
  };
}

// File Source Types - Based on OpenCode's FilePartSource union
export type FileSource = FileSourceFile | FileSourceSymbol;

export interface FileSourceFile {
  type: 'file';
  path: string;
  text: {
    value: string;
    start: number;
    end: number;
  };
}

export interface FileSourceSymbol {
  type: 'symbol';
  path: string;
  name: string;
  kind: number;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  text: {
    value: string;
    start: number;
    end: number;
  };
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

// Remove duplicate import - TokenUsage is already defined above