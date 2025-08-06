/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  ProviderCountTokensRequest,
  ProviderCountTokensResponse,
  ProviderEmbedRequest,
  ProviderEmbedResponse,
  ProviderCapabilities,
  ProviderInfo,
  ProviderConfig,
  ValidationResult,
  CredentialRequirement
} from './types.js';

/**
 * Core AI Provider interface that all AI providers must implement
 */
export interface AIProvider {
  /**
   * Generate content based on the request
   */
  generateContent(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse>;

  /**
   * Generate content as a stream of responses
   */
  generateContentStream(request: ProviderGenerateRequest): AsyncGenerator<ProviderGenerateResponse>;

  /**
   * Count tokens for the given request
   */
  countTokens(request: ProviderCountTokensRequest): Promise<ProviderCountTokensResponse>;

  /**
   * Generate embeddings for the given text
   */
  embedContent(request: ProviderEmbedRequest): Promise<ProviderEmbedResponse>;

  /**
   * Get provider information and capabilities
   */
  getInfo(): ProviderInfo;

  /**
   * Get supported models
   */
  getSupportedModels(): string[];

  /**
   * Check if a specific model is supported
   */
  isModelSupported(model: string): boolean;

  /**
   * Get capabilities for a specific model
   */
  getModelCapabilities(model: string): ProviderCapabilities;

  /**
   * Validate the provider configuration
   */
  validateConfig(): Promise<boolean>;

  /**
   * Clean up resources when the provider is no longer needed
   */
  dispose?(): Promise<void>;
}

/**
 * Factory interface for creating AI providers
 */
export interface AIProviderFactory {
  /**
   * Create a provider instance with the given configuration
   */
  create(config: ProviderConfig): Promise<AIProvider>;

  /**
   * Validate provider configuration
   */
  validateConfig(config: ProviderConfig): ValidationResult;

  /**
   * Get required credentials for this provider
   */
  getRequiredCredentials(): CredentialRequirement[];

  /**
   * Get provider information
   */
  getProviderInfo(): ProviderInfo;
}

