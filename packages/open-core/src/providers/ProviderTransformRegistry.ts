/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ModelMessage,
  ModelCapabilities,
  ModelParameters,
  ProviderTool
} from '../types/index.js';

/**
 * Provider Transform Registry - OpenCode-inspired provider optimization
 * 
 * Centralizes all provider-specific optimizations, transformations, and
 * compatibility handling. Implements OpenCode's battle-tested patterns for
 * handling the quirks and optimizations of different AI providers.
 */
export class ProviderTransformRegistry {
  private static capabilities = new Map<string, ModelCapabilities>();

  /**
   * Get model capabilities for optimization decisions
   */
  getModelCapabilities(providerId: string, modelId: string): ModelCapabilities {
    const key = `${providerId}:${modelId}`;
    
    if (ProviderTransformRegistry.capabilities.has(key)) {
      return ProviderTransformRegistry.capabilities.get(key)!;
    }

    // Detect capabilities based on model ID patterns
    const capabilities = this.detectCapabilities(providerId, modelId);
    ProviderTransformRegistry.capabilities.set(key, capabilities);
    return capabilities;
  }

  /**
   * Transform messages for provider-specific requirements
   */
  transformMessages(
    messages: ModelMessage[],
    providerId: string,
    modelId: string
  ): ModelMessage[] {
    let transformed = [...messages];

    // Claude-specific transformations
    if (modelId.includes('claude')) {
      transformed = this.normalizeToolCallIds(transformed);
    }

    // Apply caching for providers that support it
    if (this.supportsCaching(providerId)) {
      transformed = this.applyCaching(transformed, providerId);
    }

    return transformed;
  }

  /**
   * Get optimal parameters for provider/model combination
   */
  getOptimalParameters(providerId: string, modelId: string): ModelParameters {
    const capabilities = this.getModelCapabilities(providerId, modelId);
    
    return {
      temperature: capabilities.optimalTemperature,
      topP: capabilities.optimalTopP,
      maxTokens: this.getOptimalMaxTokens(capabilities),
      caching: this.getCachingConfig(providerId)
    };
  }

  /**
   * Get tools disabled for specific provider/model combinations (OpenCode pattern)
   */
  getDisabledTools(providerId: string, modelId: string): string[] {
    const disabled: string[] = [];

    // Claude-specific tool filtering
    if (modelId.includes('claude')) {
      disabled.push('patch'); // Claude struggles with patch tool
    }

    // GPT-specific tool filtering  
    if (modelId.includes('gpt-') || modelId.includes('o1') || modelId.includes('o3')) {
      disabled.push('todowrite', 'todoread'); // GPT models don't work well with todo tools
    }

    // Qwen-specific tool filtering
    if (modelId.includes('qwen')) {
      disabled.push('patch', 'todowrite', 'todoread');
    }

    // O1/O3 models don't support tools yet
    if (modelId.includes('o1') || modelId.includes('o3')) {
      disabled.push('*'); // Disable all tools
    }

    return disabled;
  }

  /**
   * Transform tools for provider compatibility
   */
  transformTools(
    tools: any[],
    providerId: string,
    modelId: string
  ): ProviderTool[] {
    return tools.map(tool => {
      let parameters = tool.schema?.parameters || tool.parameters || {};

      // OpenAI-specific transformations
      if (providerId === 'openai') {
        parameters = this.optionalToNullable(parameters);
      }

      // Google/Gemini-specific transformations
      if (providerId === 'google') {
        parameters = this.sanitizeGeminiParameters(parameters);
      }

      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters
        }
      };
    });
  }

  /**
   * Detect model capabilities based on patterns
   */
  private detectCapabilities(providerId: string, modelId: string): ModelCapabilities {
    // Claude models
    if (modelId.includes('claude')) {
      const isLatest = modelId.includes('claude-3-5') || modelId.includes('claude-3.5');
      return {
        maxContextLength: isLatest ? 200000 : 100000,
        supportsToolCalls: true,
        supportsImages: true,
        supportsCaching: true,
        modelFamily: 'claude',
        optimalTemperature: 0
      };
    }

    // GPT models
    if (modelId.includes('gpt-')) {
      const isGPT4 = modelId.includes('gpt-4');
      const isTurbo = modelId.includes('turbo');
      return {
        maxContextLength: isGPT4 ? (isTurbo ? 128000 : 8192) : 4096,
        supportsToolCalls: isGPT4,
        supportsImages: modelId.includes('vision') || modelId.includes('gpt-4o'),
        supportsCaching: false,
        modelFamily: 'gpt',
        optimalTemperature: 0
      };
    }

    // O1 models
    if (modelId.includes('o1') || modelId.includes('o3')) {
      return {
        maxContextLength: 128000,
        supportsToolCalls: false, // O1 doesn't support tools yet
        supportsImages: false,
        supportsCaching: false,
        modelFamily: 'gpt',
        optimalTemperature: 1 // O1 uses different temperature handling
      };
    }

    // Gemini models
    if (modelId.includes('gemini')) {
      const isPro = modelId.includes('pro');
      return {
        maxContextLength: isPro ? 128000 : 32000,
        supportsToolCalls: true,
        supportsImages: true,
        supportsCaching: false,
        modelFamily: 'gemini',
        optimalTemperature: 0
      };
    }

    // Qwen models
    if (modelId.includes('qwen')) {
      return {
        maxContextLength: 32000,
        supportsToolCalls: true,
        supportsImages: modelId.includes('vl'),
        supportsCaching: false,
        modelFamily: 'qwen',
        optimalTemperature: 0.55, // Qwen works better with higher temperature
        optimalTopP: 1
      };
    }

    // Default capabilities
    return {
      maxContextLength: 16000,
      supportsToolCalls: true,
      supportsImages: false,
      supportsCaching: false,
      modelFamily: 'other',
      optimalTemperature: 0
    };
  }

  /**
   * Normalize tool call IDs for Claude compatibility
   */
  private normalizeToolCallIds(messages: ModelMessage[]): ModelMessage[] {
    return messages.map(message => {
      if (Array.isArray(message.content)) {
        message.content = message.content.map(part => {
          if ('toolCallId' in part && part.toolCallId) {
            return {
              ...part,
              // Claude requires clean tool call IDs (alphanumeric, underscore, hyphen only)
              toolCallId: part.toolCallId.replace(/[^a-zA-Z0-9_-]/g, '_')
            };
          }
          return part;
        });
      }
      return message;
    });
  }

  /**
   * Apply caching headers for providers that support it
   */
  private applyCaching(messages: ModelMessage[], providerId: string): ModelMessage[] {
    const cachingConfigs = {
      'anthropic': { cacheControl: { type: 'ephemeral' } },
      'openrouter': { cache_control: { type: 'ephemeral' } },
      'bedrock': { cachePoint: { type: 'ephemeral' } }
    };

    const config = cachingConfigs[providerId as keyof typeof cachingConfigs];
    if (!config) return messages;

    // Cache system messages and recent conversation (OpenCode pattern)
    const systemMessages = messages.filter(m => m.role === 'system').slice(0, 2);
    const recentMessages = messages.filter(m => m.role !== 'system').slice(-2);

    [...systemMessages, ...recentMessages].forEach(message => {
      message.providerOptions = { ...message.providerOptions, ...config };
    });

    return messages;
  }

  /**
   * Convert optional parameters to nullable for OpenAI compatibility
   */
  private optionalToNullable(schema: any): any {
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      if (schema.type === 'object' && schema.properties) {
        const newProperties: any = {};
        for (const [key, value] of Object.entries(schema.properties)) {
          if (value && typeof value === 'object' && 'default' in value) {
            // OpenAI uses null instead of undefined for optional parameters
            newProperties[key] = { ...value, nullable: true };
            delete newProperties[key].default;
          } else {
            newProperties[key] = this.optionalToNullable(value);
          }
        }
        return { ...schema, properties: newProperties };
      }
    }
    return schema;
  }

  /**
   * Sanitize parameters for Gemini compatibility
   */
  private sanitizeGeminiParameters(schema: any): any {
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      // Remove default when anyOf is present (Gemini gets confused)
      if (schema.anyOf) {
        const { default: _, ...rest } = schema;
        return { 
          ...rest, 
          anyOf: schema.anyOf.map((item: any) => this.sanitizeGeminiParameters(item)) 
        };
      }
      
      // Gemini only supports 'enum' and 'date-time' for STRING format
      if (schema.type === 'string' && schema.format && 
          schema.format !== 'enum' && schema.format !== 'date-time') {
        const { format: _, ...rest } = schema;
        return rest;
      }

      // Handle enum values - Gemini API only allows enum for STRING type
      if (schema.enum && Array.isArray(schema.enum)) {
        if (schema.type !== 'string') {
          schema.type = 'string';
        }
        // Filter out null/undefined and convert to strings
        schema.enum = schema.enum
          .filter((value: unknown) => value !== null && value !== undefined)
          .map((value: unknown) => String(value));
      }

      if (schema.properties) {
        const newProperties: any = {};
        for (const [key, value] of Object.entries(schema.properties)) {
          newProperties[key] = this.sanitizeGeminiParameters(value);
        }
        return { ...schema, properties: newProperties };
      }
    }
    return schema;
  }

  /**
   * Check if provider supports caching
   */
  private supportsCaching(providerId: string): boolean {
    return ['anthropic', 'openrouter', 'bedrock'].includes(providerId);
  }

  /**
   * Get optimal max tokens for model
   */
  private getOptimalMaxTokens(capabilities: ModelCapabilities): number {
    // Reserve space for context
    return Math.min(4096, Math.floor(capabilities.maxContextLength * 0.1));
  }

  /**
   * Get caching configuration for provider
   */
  private getCachingConfig(providerId: string): Record<string, any> | undefined {
    const cachingConfigs = {
      'anthropic': { cacheControl: { type: 'ephemeral' } },
      'openrouter': { cache_control: { type: 'ephemeral' } },
      'bedrock': { cachePoint: { type: 'ephemeral' } }
    };

    return cachingConfigs[providerId as keyof typeof cachingConfigs];
  }
}