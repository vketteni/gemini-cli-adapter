/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthProviderFactory,
  AuthProvider,
  AuthConfig,
  AuthValidationResult,
  AuthConfigRequirement
} from '../authProvider.js';
import { OpenAIAuthProvider } from './openaiAuthProvider.js';

/**
 * Factory for creating OpenAI Auth Provider instances
 */
export class OpenAIAuthProviderFactory implements AuthProviderFactory {
  async create(config: AuthConfig): Promise<AuthProvider> {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid OpenAI auth configuration: ${validation.errors.join(', ')}`);
    }

    return new OpenAIAuthProvider(config);
  }

  validateConfig(config: AuthConfig): AuthValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate auth type
    if (config.type !== 'api_key') {
      errors.push(`Unsupported auth type '${config.type}' for OpenAI. Only 'api_key' is supported.`);
      return { valid: false, errors, warnings };
    }

    // Validate API key
    if (!config.apiKey) {
      errors.push('API key is required for OpenAI authentication');
    } else {
      if (!config.apiKey.startsWith('sk-')) {
        errors.push('Invalid OpenAI API key format. Keys should start with "sk-"');
      }
      
      if (config.apiKey.length < 20) {
        warnings.push('API key seems too short, please verify it is correct');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  getSupportedAuthTypes(): string[] {
    return ['api_key'];
  }

  getRequiredConfig(authType: string): AuthConfigRequirement[] {
    if (authType !== 'api_key') {
      return [];
    }

    return [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'OpenAI API key from https://platform.openai.com/api-keys',
        envVar: 'OPENAI_API_KEY',
        sensitive: true,
        validation: (value: string) => typeof value === 'string' && value.startsWith('sk-')
      }
    ];
  }
}