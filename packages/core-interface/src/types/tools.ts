/**
 * Tool system type definitions
 */

export interface ToolMetadata {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  category?: string;
}

export interface ToolRequest {
  toolName: string;
  parameters: Record<string, unknown>;
  requestId: string;
}

export interface ToolEvent {
  type: 'start' | 'progress' | 'output' | 'error' | 'complete';
  requestId: string;
  data: unknown;
  timestamp: Date;
}
