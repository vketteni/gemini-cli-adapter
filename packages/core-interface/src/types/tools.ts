/**
 * Tool system type definitions
 */

import { ValidationResult } from './config.js';

/**
 * Icon enum for tool and UI representation
 */
export enum Icon {
  Hammer = 'hammer',
  Gear = 'gear',
  File = 'file',
  Edit = 'edit',
  Search = 'search',
  Code = 'code',
  Terminal = 'terminal',
  Download = 'download',
  Upload = 'upload',
  Execute = 'execute',
  Fetch = 'fetch',
  Error = 'error',
  Success = 'success',
  Warning = 'warning',
  Info = 'info'
}

export interface ToolMetadata {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  category?: string;
  icon?: Icon;
}

export interface ToolRequest {
  toolName: string;
  parameters: Record<string, unknown>;
  requestId: string;
}

export enum ToolConfirmationOutcome {
  ALLOW = 'allow',
  ALWAYS_ALLOW = 'always_allow',
  ALWAYS_ALLOW_MCP_SERVER = 'always_allow_mcp_server',
  ALWAYS_ALLOW_TOOL = 'always_allow_tool',
  REJECT = 'reject',
  CANCEL = 'cancel'
}

export interface ThoughtSummary {
  summary: string;
  wordCount: number;
}

export interface ToolCallStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number;
}

export interface ToolCallConfirmationDetails {
  toolName: string;
  description?: string;
  parameters: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Tool {
  name: string;
  displayName: string;
  description: string;
  icon?: Icon;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
  validate?: (params: Record<string, unknown>) => ValidationResult;
}

export interface ToolRegistry {
  register(tool: Tool): void;
  unregister(toolName: string): void;
  getTool(toolName: string): Tool | undefined;
  getAllTools(): Tool[];
}

export interface ToolEvent {
  type: 'start' | 'progress' | 'output' | 'error' | 'complete';
  requestId: string;
  data: unknown;
  timestamp: Date;
}
