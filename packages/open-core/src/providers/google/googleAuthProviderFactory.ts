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
import { GoogleAuthProvider } from './googleAuthProvider.js';
import { existsSync } from 'fs';

/**
 * Factory for creating Google Auth Provider instances
 */
export class GoogleAuthProviderFactory implements AuthProviderFactory {
  async create(config: AuthConfig): Promise<AuthProvider> {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid Google auth configuration: ${validation.errors.join(', ')}`);
    }

    return new GoogleAuthProvider(config);
  }

  validateConfig(config: AuthConfig): AuthValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate auth type
    const supportedTypes = this.getSupportedAuthTypes();
    if (!supportedTypes.includes(config.type)) {
      errors.push(`Unsupported auth type '${config.type}'. Supported: ${supportedTypes.join(', ')}`);
      return { valid: false, errors, warnings };
    }

    // Type-specific validation
    switch (config.type) {
      case 'api_key':
        this.validateApiKeyConfig(config, errors, warnings);
        break;
      case 'oauth2':
        this.validateOAuth2Config(config, errors, warnings);
        break;
      case 'service_account':
        this.validateServiceAccountConfig(config, errors, warnings);
        break;
      case 'application_default':
        // No specific validation needed - will be checked at runtime
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  private validateApiKeyConfig(config: AuthConfig, errors: string[], warnings: string[]): void {
    if (!config.apiKey) {
      errors.push('API key is required for api_key auth type');
    } else if (!config.apiKey.startsWith('AI')) {
      warnings.push('Google API keys typically start with "AI"');
    }
  }

  private validateOAuth2Config(config: AuthConfig, errors: string[], warnings: string[]): void {
    if (!config.clientId) {
      errors.push('Client ID is required for OAuth2');
    }
    if (!config.clientSecret) {
      errors.push('Client secret is required for OAuth2');
    }
    if (config.redirectUri) {
      try {
        new URL(config.redirectUri);
      } catch {
        errors.push('Invalid redirect URI format');
      }
    }
  }

  private validateServiceAccountConfig(config: AuthConfig, errors: string[], warnings: string[]): void {
    if (!config.serviceAccountPath && !config.credentials) {
      errors.push('Either serviceAccountPath or credentials object is required for service account auth');
    }
    
    if (config.serviceAccountPath) {
      if (!existsSync(config.serviceAccountPath)) {
        errors.push(`Service account key file not found: ${config.serviceAccountPath}`);
      }
    }

    if (config.credentials) {
      const required = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      for (const field of required) {
        if (!config.credentials[field]) {
          errors.push(`Missing required field in service account credentials: ${field}`);
        }
      }
    }
  }

  getSupportedAuthTypes(): string[] {
    return ['api_key', 'oauth2', 'service_account', 'application_default'];
  }

  getRequiredConfig(authType: string): AuthConfigRequirement[] {
    switch (authType) {
      case 'api_key':
        return [
          {
            name: 'apiKey',
            type: 'string',
            required: true,
            description: 'Google AI API key from Google AI Studio',
            envVar: 'GEMINI_API_KEY',
            sensitive: true,
            validation: (value: string) => typeof value === 'string' && value.length > 0
          }
        ];

      case 'oauth2':
        return [
          {
            name: 'clientId',
            type: 'string',
            required: true,
            description: 'OAuth2 client ID from Google Cloud Console',
            envVar: 'GOOGLE_CLIENT_ID'
          },
          {
            name: 'clientSecret',
            type: 'string',
            required: true,
            description: 'OAuth2 client secret from Google Cloud Console',
            envVar: 'GOOGLE_CLIENT_SECRET',
            sensitive: true
          },
          {
            name: 'redirectUri',
            type: 'string',
            required: false,
            description: 'OAuth2 redirect URI (default: urn:ietf:wg:oauth:2.0:oob)'
          },
          {
            name: 'scopes',
            type: 'string',
            required: false,
            description: 'Comma-separated list of OAuth2 scopes'
          }
        ];

      case 'service_account':
        return [
          {
            name: 'serviceAccountPath',
            type: 'file_path',
            required: false,
            description: 'Path to service account key file (JSON)',
            envVar: 'GOOGLE_APPLICATION_CREDENTIALS'
          },
          {
            name: 'credentials',
            type: 'string',
            required: false,
            description: 'Service account credentials as JSON object',
            sensitive: true
          }
        ];

      case 'application_default':
        return [
          {
            name: 'scopes',
            type: 'string',
            required: false,
            description: 'Comma-separated list of scopes (optional)'
          }
        ];

      default:
        return [];
    }
  }
}