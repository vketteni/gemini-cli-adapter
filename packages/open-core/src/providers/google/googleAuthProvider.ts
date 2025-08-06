/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthProvider,
  AuthConfig,
  AuthResult,
  AuthStatus,
  AuthType
} from '../authProvider.js';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { ProviderError } from '../types.js';

/**
 * Google Authentication Provider supporting multiple Google auth methods
 */
export class GoogleAuthProvider implements AuthProvider {
  private config: AuthConfig;
  private googleAuth?: GoogleAuth;
  private oauth2Client?: OAuth2Client;
  private currentToken?: string;
  private tokenExpiry?: Date;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  async authenticate(config: AuthConfig): Promise<AuthResult> {
    this.config = { ...this.config, ...config };

    try {
      switch (this.config.type) {
        case 'api_key':
          return this.authenticateWithApiKey();
        case 'oauth2':
          return this.authenticateWithOAuth2();
        case 'service_account':
          return this.authenticateWithServiceAccount();
        case 'application_default':
          return this.authenticateWithApplicationDefault();
        default:
          throw new ProviderError(
            `Unsupported Google auth type: ${this.config.type}`,
            'UNSUPPORTED_AUTH_TYPE'
          );
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private async authenticateWithApiKey(): Promise<AuthResult> {
    if (!this.config.apiKey) {
      throw new ProviderError('API key is required', 'MISSING_API_KEY');
    }

    // For API key auth, we just store the key - validation happens on first API call
    this.currentToken = this.config.apiKey;
    
    return {
      success: true,
      accessToken: this.config.apiKey,
      metadata: { authType: 'api_key' }
    };
  }

  private async authenticateWithOAuth2(): Promise<AuthResult> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new ProviderError('Client ID and secret are required for OAuth2', 'MISSING_CREDENTIALS');
    }

    this.oauth2Client = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri || 'urn:ietf:wg:oauth:2.0:oob'
    );

    // For CLI applications, we need to use device flow or redirect to browser
    const scopes = this.config.scopes || [
      'https://www.googleapis.com/auth/generative-language',
      'https://www.googleapis.com/auth/cloud-platform'
    ];

    const authorizeUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    // In a real implementation, this would open the browser or show the URL to the user
    // For now, we'll throw an error indicating manual setup is needed
    throw new ProviderError(
      `OAuth2 setup required. Please visit: ${authorizeUrl}`,
      'OAUTH_SETUP_REQUIRED'
    );
  }

  private async authenticateWithServiceAccount(): Promise<AuthResult> {
    if (!this.config.serviceAccountPath && !this.config.credentials) {
      throw new ProviderError(
        'Service account key file path or credentials object is required',
        'MISSING_SERVICE_ACCOUNT'
      );
    }

    this.googleAuth = new GoogleAuth({
      keyFile: this.config.serviceAccountPath,
      credentials: this.config.credentials,
      scopes: this.config.scopes || [
        'https://www.googleapis.com/auth/generative-language',
        'https://www.googleapis.com/auth/cloud-platform'
      ]
    });

    const client = await this.googleAuth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new ProviderError('Failed to obtain access token', 'TOKEN_FETCH_FAILED');
    }

    this.currentToken = accessToken.token;
    this.tokenExpiry = accessToken.res?.data.expires_in 
      ? new Date(Date.now() + accessToken.res.data.expires_in * 1000)
      : undefined;

    return {
      success: true,
      accessToken: accessToken.token,
      expiresAt: this.tokenExpiry,
      metadata: { authType: 'service_account' }
    };
  }

  private async authenticateWithApplicationDefault(): Promise<AuthResult> {
    this.googleAuth = new GoogleAuth({
      scopes: this.config.scopes || [
        'https://www.googleapis.com/auth/generative-language',
        'https://www.googleapis.com/auth/cloud-platform'
      ]
    });

    try {
      const client = await this.googleAuth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new ProviderError('Failed to obtain access token', 'TOKEN_FETCH_FAILED');
      }

      this.currentToken = accessToken.token;
      this.tokenExpiry = accessToken.res?.data.expires_in 
        ? new Date(Date.now() + accessToken.res.data.expires_in * 1000)
        : undefined;

      return {
        success: true,
        accessToken: accessToken.token,
        expiresAt: this.tokenExpiry,
        metadata: { authType: 'application_default' }
      };
    } catch (error) {
      throw new ProviderError(
        'Application Default Credentials not found. Please run "gcloud auth application-default login"',
        'ADC_NOT_FOUND',
        undefined,
        error
      );
    }
  }

  async refreshCredentials(): Promise<void> {
    if (!this.needsRefresh()) {
      return;
    }

    if (this.config.type === 'api_key') {
      // API keys don't expire
      return;
    }

    // Re-authenticate to refresh credentials
    await this.authenticate(this.config);
  }

  async clearCredentials(): Promise<void> {
    this.currentToken = undefined;
    this.tokenExpiry = undefined;
    this.googleAuth = undefined;
    this.oauth2Client = undefined;
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.currentToken) {
      return false;
    }

    if (this.config.type === 'api_key') {
      // API key validation would require making an actual API call
      return true;
    }

    // For token-based auth, check if token is expired
    return !this.needsRefresh();
  }

  getAuthStatus(): AuthStatus {
    return {
      authenticated: !!this.currentToken,
      expiresAt: this.tokenExpiry,
      needsRefresh: this.needsRefresh(),
      metadata: { authType: this.config.type }
    };
  }

  getAuthType(): string {
    return this.config.type;
  }

  requiresBrowser(): boolean {
    return this.config.type === 'oauth2';
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.currentToken) {
      throw new ProviderError('No valid credentials available', 'NO_CREDENTIALS');
    }

    if (this.needsRefresh()) {
      await this.refreshCredentials();
    }

    if (this.config.type === 'api_key') {
      return {
        'x-goog-api-key': this.currentToken
      };
    } else {
      return {
        'Authorization': `Bearer ${this.currentToken}`
      };
    }
  }

  private needsRefresh(): boolean {
    if (!this.tokenExpiry) {
      return false;
    }
    
    // Refresh if token expires in the next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return this.tokenExpiry <= fiveMinutesFromNow;
  }
}