/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIProvider, AIProviderFactory } from './aiProvider.js';
import { ProviderConfig, ProviderInfo } from './types.js';
import { AuthProvider, AuthProviderFactory, AuthConfig } from './authProvider.js';
import { ProviderError } from './types.js';

/**
 * Registry for managing AI and Auth providers
 */
export class ProviderRegistry {
  private aiProviders = new Map<string, AIProviderFactory>();
  private authProviders = new Map<string, AuthProviderFactory>();
  private activeAIProviders = new Map<string, AIProvider>();
  private activeAuthProviders = new Map<string, AuthProvider>();

  /**
   * Register an AI provider factory
   */
  registerAIProvider(name: string, factory: AIProviderFactory): void {
    this.aiProviders.set(name, factory);
  }

  /**
   * Register an auth provider factory
   */
  registerAuthProvider(name: string, factory: AuthProviderFactory): void {
    this.authProviders.set(name, factory);
  }

  /**
   * Get an AI provider instance, creating if necessary
   */
  async getAIProvider(name: string, config?: ProviderConfig): Promise<AIProvider> {
    const cacheKey = `${name}:${JSON.stringify(config)}`;
    
    if (this.activeAIProviders.has(cacheKey)) {
      return this.activeAIProviders.get(cacheKey)!;
    }

    const factory = this.aiProviders.get(name);
    if (!factory) {
      throw new ProviderError(`AI provider '${name}' not found`, 'PROVIDER_NOT_FOUND');
    }

    if (!config) {
      throw new ProviderError(`Configuration required for AI provider '${name}'`, 'CONFIG_REQUIRED');
    }

    // Validate configuration
    const validation = factory.validateConfig(config);
    if (!validation.valid) {
      throw new ProviderError(
        `Invalid configuration for AI provider '${name}': ${validation.errors.join(', ')}`,
        'INVALID_CONFIG'
      );
    }

    const provider = await factory.create(config);
    this.activeAIProviders.set(cacheKey, provider);
    return provider;
  }

  /**
   * Get an auth provider instance, creating if necessary
   */
  async getAuthProvider(name: string, config?: AuthConfig): Promise<AuthProvider> {
    const cacheKey = `${name}:${JSON.stringify(config)}`;
    
    if (this.activeAuthProviders.has(cacheKey)) {
      return this.activeAuthProviders.get(cacheKey)!;
    }

    const factory = this.authProviders.get(name);
    if (!factory) {
      throw new ProviderError(`Auth provider '${name}' not found`, 'PROVIDER_NOT_FOUND');
    }

    if (!config) {
      throw new ProviderError(`Configuration required for auth provider '${name}'`, 'CONFIG_REQUIRED');
    }

    // Validate configuration
    const validation = factory.validateConfig(config);
    if (!validation.valid) {
      throw new ProviderError(
        `Invalid configuration for auth provider '${name}': ${validation.errors.join(', ')}`,
        'INVALID_CONFIG'
      );
    }

    const provider = await factory.create(config);
    this.activeAuthProviders.set(cacheKey, provider);
    return provider;
  }

  /**
   * List available AI providers
   */
  listAIProviders(): ProviderInfo[] {
    return Array.from(this.aiProviders.entries()).map(([name, factory]) => ({
      ...factory.getProviderInfo(),
      name // Override with registry name to ensure consistency
    }));
  }

  /**
   * List available auth providers
   */
  listAuthProviders(): string[] {
    return Array.from(this.authProviders.keys());
  }

  /**
   * Check if an AI provider is available
   */
  isAIProviderAvailable(name: string): boolean {
    return this.aiProviders.has(name);
  }

  /**
   * Check if an auth provider is available
   */
  isAuthProviderAvailable(name: string): boolean {
    return this.authProviders.has(name);
  }

  /**
   * Get AI provider factory
   */
  getAIProviderFactory(name: string): AIProviderFactory | undefined {
    return this.aiProviders.get(name);
  }

  /**
   * Get auth provider factory
   */
  getAuthProviderFactory(name: string): AuthProviderFactory | undefined {
    return this.authProviders.get(name);
  }

  /**
   * Dispose of all active providers and clear registry
   */
  async dispose(): Promise<void> {
    // Dispose AI providers
    for (const provider of this.activeAIProviders.values()) {
      if (provider.dispose) {
        await provider.dispose();
      }
    }
    this.activeAIProviders.clear();

    // Dispose auth providers
    for (const provider of this.activeAuthProviders.values()) {
      if (provider.dispose) {
        await provider.dispose();
      }
    }
    this.activeAuthProviders.clear();
  }

  /**
   * Remove a specific provider instance from cache
   */
  async removeProvider(type: 'ai' | 'auth', name: string, config?: any): Promise<void> {
    const cacheKey = `${name}:${JSON.stringify(config)}`;
    
    if (type === 'ai') {
      const provider = this.activeAIProviders.get(cacheKey);
      if (provider && provider.dispose) {
        await provider.dispose();
      }
      this.activeAIProviders.delete(cacheKey);
    } else {
      const provider = this.activeAuthProviders.get(cacheKey);
      if (provider && provider.dispose) {
        await provider.dispose();
      }
      this.activeAuthProviders.delete(cacheKey);
    }
  }
}

/**
 * Provider information for listing
 */
/**
 * Global provider registry instance
 */
export const globalProviderRegistry = new ProviderRegistry();