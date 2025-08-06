/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIProviderFactory, AIProvider } from '../aiProvider.js';
import { 
  ProviderConfig, 
  ValidationResult, 
  CredentialRequirement, 
  ProviderInfo 
} from '../types.js';
import { OpenAIProvider } from './openaiAIProvider.js';

/**
 * Factory for creating OpenAI Provider instances
 */
export class OpenAIProviderFactory implements AIProviderFactory {
  async create(config: ProviderConfig): Promise<AIProvider> {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid OpenAI provider configuration: ${validation.errors.join(', ')}`);
    }

    return new OpenAIProvider(config);
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!config.apiKey) {
      errors.push('API key is required (OPENAI_API_KEY environment variable or config.apiKey)');
    }

    // Validate API key format
    if (config.apiKey && !config.apiKey.startsWith('sk-')) {
      warnings.push('OpenAI API keys typically start with "sk-"');
    }

    // Validate model if specified
    if (config.model) {
      const supportedModels = this.getProviderInfo().models || [];
      if (!supportedModels.includes(config.model)) {
        warnings.push(
          `Model '${config.model}' may not be supported. Supported models: ${supportedModels.join(', ')}`
        );
      }
    }

    // Validate base URL if provided
    if (config.baseUrl) {
      try {
        const url = new URL(config.baseUrl);
        if (!url.protocol.startsWith('http')) {
          errors.push('Base URL must use HTTP or HTTPS protocol');
        }
      } catch {
        errors.push('Invalid base URL format');
      }
    }

    // Validate timeout
    if (config.timeout !== undefined) {
      if (typeof config.timeout !== 'number' || config.timeout <= 0) {
        errors.push('Timeout must be a positive number');
      } else if (config.timeout < 1000) {
        warnings.push('Timeout less than 1 second may cause frequent timeouts');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  getRequiredCredentials(): CredentialRequirement[] {
    return [
      {
        name: 'apiKey',
        type: 'api_key',
        required: true,
        description: 'OpenAI API key (get from https://platform.openai.com/api-keys)',
        envVar: 'OPENAI_API_KEY',
        validation: (value: string) => typeof value === 'string' && value.startsWith('sk-')
      }
    ];
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: 'openai',
      version: '1.0.0',
      models: [
        'gpt-4o',
        'gpt-4o-mini', 
        'gpt-4-turbo',
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k',
        'text-embedding-3-large',
        'text-embedding-3-small',
        'text-embedding-ada-002'
      ],
      capabilities: {
        streaming: true,
        toolCalling: true,
        imageInput: true,
        systemMessages: true,
        embeddings: true,
        maxTokens: 128000,
        supportedImageFormats: ['jpeg', 'png', 'gif', 'webp']
      }
    };
  }
}