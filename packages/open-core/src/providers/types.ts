/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider-agnostic types based on OpenAI format for maximum compatibility
 */

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | ProviderMessageContentPart[];
  name?: string;
  tool_calls?: ProviderToolCall[];
  tool_call_id?: string;
}

export interface ProviderMessageContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface ProviderToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ProviderTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
  };
}

export interface ProviderGenerateRequest {
  messages: ProviderMessage[];
  model: string;
  tools?: ProviderTool[];
  tool_choice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
}

export interface ProviderChoice {
  index: number;
  message?: ProviderMessage;
  delta?: Partial<ProviderMessage>; // for streaming
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

export interface ProviderUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ProviderGenerateResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ProviderChoice[];
  usage?: ProviderUsage;
  system_fingerprint?: string;
}

export interface ProviderCountTokensRequest {
  messages: ProviderMessage[];
  model: string;
  tools?: ProviderTool[];
}

export interface ProviderCountTokensResponse {
  total_tokens: number;
  prompt_tokens: number;
}

export interface ProviderEmbedRequest {
  input: string | string[];
  model: string;
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
}

export interface ProviderEmbedResponse {
  object: 'list';
  data: {
    object: 'embedding';
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ProviderCapabilities {
  streaming: boolean;
  toolCalling: boolean;
  imageInput: boolean;
  systemMessages: boolean;
  embeddings: boolean;
  maxTokens?: number;
  supportedImageFormats?: string[];
}

export interface ProviderInfo {
  name: string;
  version: string;
  models?: string[];
  capabilities?: ProviderCapabilities;
}

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  name: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  credentials?: Record<string, any>;
  options?: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Validation result for provider configuration
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Credential requirement for provider setup
 */
export interface CredentialRequirement {
  name: string;
  type: 'api_key' | 'oauth' | 'service_account' | 'bearer_token';
  required: boolean;
  description: string;
  envVar?: string;
  validation?: (value: string) => boolean;
}

/**
 * Error types for provider operations
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ProviderAuthError extends ProviderError {
  constructor(message: string, originalError?: any) {
    super(message, 'AUTH_ERROR', 401, originalError);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(message: string, retryAfter?: number, originalError?: any) {
    super(message, 'RATE_LIMIT', 429, originalError);
    this.name = 'ProviderRateLimitError';
    this.retryAfter = retryAfter;
  }
  
  retryAfter?: number;
}

export class ProviderQuotaError extends ProviderError {
  constructor(message: string, originalError?: any) {
    super(message, 'QUOTA_EXCEEDED', 429, originalError);
    this.name = 'ProviderQuotaError';
  }
}