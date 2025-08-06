/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authentication provider interface for different auth methods
 */
export interface AuthProvider {
  /**
   * Authenticate with the given configuration
   */
  authenticate(config: AuthConfig): Promise<AuthResult>;

  /**
   * Refresh credentials if they're expired or about to expire
   */
  refreshCredentials(): Promise<void>;

  /**
   * Clear stored credentials
   */
  clearCredentials(): Promise<void>;

  /**
   * Check if current credentials are valid
   */
  validateCredentials(): Promise<boolean>;

  /**
   * Get the current authentication status
   */
  getAuthStatus(): AuthStatus;

  /**
   * Get authentication type identifier
   */
  getAuthType(): string;

  /**
   * Whether this auth method requires browser interaction
   */
  requiresBrowser(): boolean;

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): Promise<Record<string, string>>;

  /**
   * Clean up auth resources
   */
  dispose?(): Promise<void>;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  serviceAccountPath?: string;
  credentials?: Record<string, any>;
  options?: Record<string, any>;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Authentication status
 */
export interface AuthStatus {
  authenticated: boolean;
  expiresAt?: Date;
  needsRefresh: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Factory for creating auth providers
 */
export interface AuthProviderFactory {
  /**
   * Create an auth provider instance
   */
  create(config: AuthConfig): Promise<AuthProvider>;

  /**
   * Validate auth configuration
   */
  validateConfig(config: AuthConfig): AuthValidationResult;

  /**
   * Get supported auth types
   */
  getSupportedAuthTypes(): string[];

  /**
   * Get required configuration for an auth type
   */
  getRequiredConfig(authType: string): AuthConfigRequirement[];
}

/**
 * Authentication configuration requirement
 */
export interface AuthConfigRequirement {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'file_path';
  required: boolean;
  description: string;
  envVar?: string;
  validation?: (value: any) => boolean;
  sensitive?: boolean; // Whether this should be masked in logs
}

/**
 * Validation result for auth configuration
 */
export interface AuthValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Common auth types
 */
export enum AuthType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  SERVICE_ACCOUNT = 'service_account',
  BEARER_TOKEN = 'bearer_token',
  BASIC_AUTH = 'basic_auth',
  NONE = 'none'
}