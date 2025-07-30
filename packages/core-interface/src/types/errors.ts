/**
 * Error type definitions for adapter communication
 */

export class AdapterError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class UnauthorizedError extends AdapterError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends AdapterError {
  constructor(message: string, public validationErrors: string[] = []) {
    super(message, 'VALIDATION_ERROR', { validationErrors });
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends AdapterError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}

export class ToolExecutionError extends AdapterError {
  constructor(
    message: string,
    public toolName: string,
    public toolError?: Error
  ) {
    super(message, 'TOOL_EXECUTION_ERROR', { toolName, originalError: toolError?.message });
    this.name = 'ToolExecutionError';
  }
}

export class SessionError extends AdapterError {
  constructor(message: string, public sessionId?: string) {
    super(message, 'SESSION_ERROR', { sessionId });
    this.name = 'SessionError';
  }
}

export class NetworkError extends AdapterError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'NETWORK_ERROR', { statusCode });
    this.name = 'NetworkError';
  }
}

// Utility functions for error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export function isAdapterError(error: unknown): error is AdapterError {
  return error instanceof AdapterError;
}