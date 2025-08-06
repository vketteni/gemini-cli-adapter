/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AIProvider,
  AuthProvider,
  ProviderConfig,
  globalProviderRegistry,
  setupProviders
} from '../providers/index.js';
import { AuthConfig } from '../providers/authProvider.js';
import { Config } from './config.js';
import { AuthType, ContentGeneratorConfig } from '../core/contentGenerator.js';

/**
 * Configuration for the provider system
 */
export interface ProviderSystemConfig {
  /** The AI provider to use (google, openai, etc.) */
  provider: string;
  /** The model to use */
  model: string;
  /** Authentication configuration */
  auth: {
    authType: string;
    [key: string]: any;
  };
  /** Additional provider options */
  options?: Record<string, any>;
}

/**
 * Helper class to create providers from configuration
 */
export class ProviderConfigManager {
  constructor() {
    // Ensure built-in providers are registered
    setupProviders();
  }

  /**
   * Create an AI provider from configuration
   */
  async createAIProvider(config: ProviderSystemConfig): Promise<AIProvider> {
    const providerConfig: ProviderConfig = {
      name: config.provider,
      model: config.model,
      apiKey: this.getApiKeyForProvider(config.provider, config.auth),
      ...config.options
    };

    return await globalProviderRegistry.getAIProvider(config.provider, providerConfig);
  }

  /**
   * Create an auth provider from configuration
   */
  async createAuthProvider(config: ProviderSystemConfig): Promise<AuthProvider> {
    const authConfig: AuthConfig = {
      type: config.auth.authType,
      ...config.auth
    };

    return await globalProviderRegistry.getAuthProvider(config.provider, authConfig);
  }

  /**
   * Convert legacy ContentGeneratorConfig to ProviderSystemConfig
   */
  convertFromContentGeneratorConfig(
    contentGenConfig: ContentGeneratorConfig,
    legacyConfig: Config
  ): ProviderSystemConfig {
    // Determine provider based on auth type
    let provider = 'google'; // default
    let authType = 'api_key';
    
    switch (contentGenConfig.authType) {
      case AuthType.USE_GEMINI:
        provider = 'google';
        authType = 'api_key';
        break;
      case AuthType.USE_VERTEX_AI:
        provider = 'google';
        authType = 'service_account';
        break;
      case AuthType.LOGIN_WITH_GOOGLE:
        provider = 'google';
        authType = 'oauth2';
        break;
      case AuthType.CLOUD_SHELL:
        provider = 'google';
        authType = 'application_default';
        break;
    }

    return {
      provider,
      model: contentGenConfig.model,
      auth: {
        authType: authType,
        apiKey: contentGenConfig.apiKey,
        // Add other auth fields as needed
      }
    };
  }

  /**
   * Convert ProviderSystemConfig to ContentGeneratorConfig for backward compatibility
   */
  convertToContentGeneratorConfig(config: ProviderSystemConfig): ContentGeneratorConfig {
    let authType: AuthType;

    if (config.provider === 'google') {
      switch (config.auth.authType) {
        case 'api_key':
          authType = AuthType.USE_GEMINI;
          break;
        case 'service_account':
          authType = AuthType.USE_VERTEX_AI;
          break;
        case 'oauth2':
          authType = AuthType.LOGIN_WITH_GOOGLE;
          break;
        case 'application_default':
          authType = AuthType.CLOUD_SHELL;
          break;
        default:
          authType = AuthType.USE_GEMINI;
      }
    } else {
      // For non-Google providers, default to API key
      authType = AuthType.USE_GEMINI;
    }

    return {
      model: config.model,
      authType,
      apiKey: config.auth.apiKey,
      // Map other fields as needed
    };
  }

  /**
   * Create a provider configuration from environment variables
   */
  createFromEnvironment(): ProviderSystemConfig {
    // Check for OpenAI configuration first
    if (process.env.OPENAI_API_KEY) {
      return {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        auth: {
          authType: 'api_key',
          apiKey: process.env.OPENAI_API_KEY
        }
      };
    }

    // Check for Google Gemini API key
    if (process.env.GEMINI_API_KEY) {
      return {
        provider: 'google',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        auth: {
          authType: 'api_key',
          apiKey: process.env.GEMINI_API_KEY
        }
      };
    }

    // Check for Google Cloud configuration
    if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION) {
      return {
        provider: 'google',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        auth: {
          authType: 'service_account',
          serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
        }
      };
    }

    // Default to Google with application default credentials
    return {
      provider: 'google',
      model: 'gemini-1.5-pro',
      auth: {
        authType: 'application_default'
      }
    };
  }

  /**
   * Get the appropriate API key for a provider
   */
  private getApiKeyForProvider(provider: string, auth: any): string | undefined {
    if (auth.apiKey) {
      return auth.apiKey;
    }

    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'google':
        return process.env.GEMINI_API_KEY;
      default:
        return undefined;
    }
  }

  /**
   * List available providers
   */
  getAvailableProviders(): string[] {
    return globalProviderRegistry.listAIProviders().map(p => p.name);
  }

  /**
   * Get provider information
   */
  getProviderInfo(providerName: string) {
    const factory = globalProviderRegistry.getAIProviderFactory(providerName);
    return factory?.getProviderInfo();
  }
}