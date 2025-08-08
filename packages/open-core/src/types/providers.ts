/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ModelMessage } from './messages.js';
import type { StreamEvent } from './streaming.js';
import type { ProviderTool } from './tools.js';

// Provider Configuration
export interface ProviderInstance {
  name: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  options?: Record<string, any>;
}

export interface ModelCapabilities {
  maxContextLength: number;
  supportsToolCalls: boolean;
  supportsImages: boolean;
  supportsCaching: boolean;
  modelFamily: 'claude' | 'gpt' | 'gemini' | 'qwen' | 'other';
  optimalTemperature: number;
  optimalTopP?: number;
}

export interface ModelParameters {
  temperature: number;
  topP?: number;
  maxTokens?: number;
  caching?: Record<string, any>;
}

// Provider Interface
export interface Provider {
  name: string;
  streamChat(params: StreamChatParams): Promise<AsyncIterable<StreamEvent>>;
  getCapabilities(modelId: string): ModelCapabilities;
}

export interface StreamChatParams {
  messages: ModelMessage[];
  tools?: ProviderTool[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  [key: string]: any;
}

// Provider Transform System
export interface ProviderTransform {
  transformMessages(messages: ModelMessage[], providerId: string, modelId: string): ModelMessage[];
  transformTools(tools: any[], providerId: string, modelId: string): ProviderTool[];
  getOptimalParameters(providerId: string, modelId: string): ModelParameters;
}