/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Tool System Types
export interface Tool {
  name: string;
  description: string;
  schema: {
    name: string;
    description: string;
    parameters?: Record<string, any>;
  };
  execute(params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult>;
}

export interface ToolExecutionContext {
  sessionID: string;
  messageID: string;
  callID: string;
  abort: AbortSignal;
  metadata?: (update: ToolMetadata) => Promise<void>;
}

export interface ToolResult {
  output: string;
  metadata?: any;
  title?: string;
}

export interface ToolMetadata {
  title?: string;
  metadata?: any;
}

// Provider-optimized tool format
export interface ProviderTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

// Tool Permissions
export interface ToolPermissions {
  edit?: boolean;
  shell?: boolean;
  network?: boolean;
  filesystem?: boolean;
}

// Tool Registry Types
export interface ToolFilter {
  providerId: string;
  modelId: string;
  permissions: ToolPermissions;
}

export interface ToolValidationResult {
  compatible: boolean;
  warnings: string[];
  alternatives?: string[];
}

export interface ToolRecommendations {
  recommended: string[];
  discouraged: string[];
  alternative?: Record<string, string>;
}