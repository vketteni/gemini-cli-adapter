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
import { GoogleAIProvider } from './googleAIProvider.js';

/**
 * Factory for creating Google AI Provider instances
 */
export class GoogleAIProviderFactory implements AIProviderFactory {
  async create(config: ProviderConfig): Promise<AIProvider> {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid Google AI provider configuration: ${validation.errors.join(', ')}`);
    }

    return new GoogleAIProvider(config);
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!config.apiKey) {
      errors.push('API key is required (GEMINI_API_KEY environment variable or config.apiKey)');
    }

    // Validate API key format
    if (config.apiKey && !config.apiKey.startsWith('AI')) {
      warnings.push('Google API keys typically start with "AI"');
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
        new URL(config.baseUrl);
      } catch {
        errors.push('Invalid base URL format');
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
        description: 'Google AI API key (get from Google AI Studio)',
        envVar: 'GEMINI_API_KEY',
        validation: (value: string) => typeof value === 'string' && value.length > 0
      }
    ];
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: 'google',
      version: '1.0.0',
      models: [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'embedding-001'
      ],
      capabilities: {
        streaming: true,
        toolCalling: true,
        imageInput: true,
        systemMessages: true,
        embeddings: true,
        maxTokens: 2097152,
        supportedImageFormats: ['jpeg', 'png', 'webp', 'heic', 'heif']
      }
    };
  }
}