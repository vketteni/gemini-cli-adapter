/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthProvider,
  AuthConfig,
  AuthResult,
  AuthStatus
} from '../authProvider.js';
import { ProviderError } from '../types.js';

/**
 * OpenAI Authentication Provider - simple API key based auth
 */
export class OpenAIAuthProvider implements AuthProvider {
  private config: AuthConfig;
  private apiKey?: string;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  async authenticate(config: AuthConfig): Promise<AuthResult> {
    this.config = { ...this.config, ...config };

    if (this.config.type !== 'api_key') {
      return {
        success: false,
        error: `Unsupported auth type for OpenAI: ${this.config.type}. Only 'api_key' is supported.`
      };
    }

    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'API key is required for OpenAI authentication'
      };
    }

    // Basic format validation
    if (!this.config.apiKey.startsWith('sk-')) {
      return {
        success: false,
        error: 'Invalid OpenAI API key format. Keys should start with "sk-"'
      };
    }

    this.apiKey = this.config.apiKey;

    return {
      success: true,
      accessToken: this.apiKey,
      metadata: { authType: 'api_key' }
    };
  }

  async refreshCredentials(): Promise<void> {
    // API keys don't expire, so no refresh needed
    return;
  }

  async clearCredentials(): Promise<void> {
    this.apiKey = undefined;
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    // For OpenAI, we can validate by making a test API call
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'Open-CLI/1.0.0'
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  getAuthStatus(): AuthStatus {
    return {
      authenticated: !!this.apiKey,
      needsRefresh: false,
      metadata: { authType: 'api_key' }
    };
  }

  getAuthType(): string {
    return 'api_key';
  }

  requiresBrowser(): boolean {
    return false;
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.apiKey) {
      throw new ProviderError('No API key available', 'NO_CREDENTIALS');
    }

    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'Open-CLI/1.0.0'
    };
  }
}