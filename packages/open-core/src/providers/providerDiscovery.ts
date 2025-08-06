/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalProviderRegistry } from './providerRegistry.js';
import { globalPluginLoader } from './pluginLoader.js';
import { setupProviders } from './setup.js';
import { ProviderInfo, ProviderConfig } from './types.js';
import { existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

/**
 * Provider discovery and auto-configuration system
 */
export class ProviderDiscovery {
  private initialized = false;

  /**
   * Initialize provider discovery with built-in and plugin providers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Setup built-in providers
    setupProviders();

    // Add common plugin search paths
    this.addCommonPluginPaths();

    // Discover and load plugins
    await this.discoverPlugins();

    this.initialized = true;
  }

  /**
   * Add common plugin search paths
   */
  private addCommonPluginPaths(): void {
    const paths = [
      // Global npm modules
      join(os.homedir(), '.npm', 'lib', 'node_modules'),
      
      // Local node_modules
      join(process.cwd(), 'node_modules'),
      
      // Open CLI specific plugin directories
      join(os.homedir(), '.open-cli', 'plugins'),
      join(process.cwd(), '.open-cli', 'plugins'),
      
      // System-wide plugin directories
      '/usr/local/lib/open-cli/plugins',
      '/opt/open-cli/plugins'
    ];

    for (const path of paths) {
      if (existsSync(path)) {
        globalPluginLoader.addPluginPath(path);
      }
    }
  }

  /**
   * Discover and load all available plugins
   */
  private async discoverPlugins(): Promise<void> {
    try {
      await globalPluginLoader.discoverAndLoadPlugins();
    } catch (error) {
      console.warn('Plugin discovery failed:', error);
    }
  }

  /**
   * Get all available providers with their capabilities
   */
  getAvailableProviders(): ProviderInfo[] {
    return globalProviderRegistry.listAIProviders();
  }

  /**
   * Auto-detect the best provider based on available credentials
   */
  async autoDetectProvider(): Promise<{ provider: string; config: ProviderConfig } | null> {
    const providers = this.getAvailableProviders();
    
    // Priority order for auto-detection
    const priorityOrder = ['openai', 'google', 'anthropic', 'local'];
    
    for (const providerName of priorityOrder) {
      const provider = providers.find(p => p.name === providerName);
      if (!provider) continue;

      const config = await this.detectProviderConfig(providerName);
      if (config) {
        return { provider: providerName, config };
      }
    }

    return null;
  }

  /**
   * Detect configuration for a specific provider
   */
  private async detectProviderConfig(providerName: string): Promise<ProviderConfig | null> {
    const factory = globalProviderRegistry.getAIProviderFactory(providerName);
    if (!factory) return null;

    const credentials = factory.getRequiredCredentials();
    const config: ProviderConfig = {
      name: providerName,
      model: this.getDefaultModel(providerName)
    };

    // Check if all required credentials are available
    for (const credential of credentials) {
      if (!credential.required) continue;

      let value: string | undefined;

      // Try environment variable first
      if (credential.envVar) {
        value = process.env[credential.envVar];
      }

      // Try common environment variable patterns
      if (!value) {
        value = this.findCredentialInEnv(providerName, credential.name);
      }

      if (!value) {
        return null; // Required credential not found
      }

      // Validate credential if validation function is provided
      if (credential.validation && !credential.validation(value)) {
        return null; // Credential validation failed
      }

      // Add to config
      (config as any)[credential.name] = value;
    }

    // Validate the complete configuration
    const validation = factory.validateConfig(config);
    if (!validation.valid) {
      return null;
    }

    return config;
  }

  /**
   * Find credential in environment variables using common patterns
   */
  private findCredentialInEnv(providerName: string, credentialName: string): string | undefined {
    const patterns = [
      `${providerName.toUpperCase()}_${credentialName.toUpperCase()}`,
      `${providerName.toUpperCase()}_API_KEY`,
      `${credentialName.toUpperCase()}`,
      `API_KEY_${providerName.toUpperCase()}`,
    ];

    for (const pattern of patterns) {
      const value = process.env[pattern];
      if (value) {
        return value;
      }
    }

    return undefined;
  }

  /**
   * Get default model for a provider
   */
  private getDefaultModel(providerName: string): string {
    const defaults: Record<string, string> = {
      'openai': 'gpt-4o-mini',
      'google': 'gemini-1.5-pro',
      'anthropic': 'claude-3-sonnet-20240229',
      'local': 'llama2'
    };

    return defaults[providerName] || 'default';
  }

  /**
   * Get provider recommendations based on use case
   */
  getProviderRecommendations(useCase: 'chat' | 'coding' | 'analysis' | 'embedding'): ProviderInfo[] {
    const providers = this.getAvailableProviders();
    
    // Filter and sort providers based on use case
    return providers
      .filter(provider => this.isProviderSuitableForUseCase(provider, useCase))
      .sort((a, b) => this.getProviderScore(b, useCase) - this.getProviderScore(a, useCase));
  }

  /**
   * Check if provider is suitable for use case
   */
  private isProviderSuitableForUseCase(provider: ProviderInfo, useCase: string): boolean {
    if (!provider.capabilities) {
      return false;
    }
    
    switch (useCase) {
      case 'chat':
        return provider.capabilities.streaming;
      case 'coding':
        return provider.capabilities.toolCalling;
      case 'analysis':
        return provider.capabilities.systemMessages;
      case 'embedding':
        return provider.capabilities.embeddings;
      default:
        return true;
    }
  }

  /**
   * Get provider score for use case (higher is better)
   */
  private getProviderScore(provider: ProviderInfo, useCase: string): number {
    let score = 0;

    if (!provider.capabilities) {
      return 0;
    }

    // Base capabilities
    if (provider.capabilities.streaming) score += 10;
    if (provider.capabilities.toolCalling) score += 15;
    if (provider.capabilities.imageInput) score += 5;
    if (provider.capabilities.embeddings) score += 5;

    // Use case specific scoring
    switch (useCase) {
      case 'coding':
        if (provider.capabilities.toolCalling) score += 20;
        if (provider.capabilities.maxTokens && provider.capabilities.maxTokens > 32000) score += 10;
        break;
      case 'chat':
        if (provider.capabilities.streaming) score += 15;
        break;
      case 'embedding':
        if (provider.capabilities.embeddings) score += 30;
        break;
    }

    // Provider specific bonuses
    if (provider.name === 'openai') score += 5; // Well-established
    if (provider.name === 'google') score += 3; // Good integration

    return score;
  }

  /**
   * Test provider connectivity
   */
  async testProvider(providerName: string, config: ProviderConfig): Promise<{
    success: boolean;
    error?: string;
    latency?: number;
  }> {
    try {
      const startTime = Date.now();
      const provider = await globalProviderRegistry.getAIProvider(providerName, config);
      
      // Test with a simple request
      await provider.countTokens({
        messages: [{ role: 'user', content: 'test' }],
        model: config.model || 'default'
      });

      const latency = Date.now() - startTime;
      return { success: true, latency };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<Record<string, {
    available: boolean;
    configured: boolean;
    latency?: number;
    error?: string;
  }>> {
    const providers = this.getAvailableProviders();
    const health: Record<string, any> = {};

    await Promise.all(
      providers.map(async (provider) => {
        const config = await this.detectProviderConfig(provider.name);
        
        if (!config) {
          health[provider.name] = {
            available: true,
            configured: false
          };
          return;
        }

        const testResult = await this.testProvider(provider.name, config);
        health[provider.name] = {
          available: true,
          configured: true,
          latency: testResult.latency,
          error: testResult.error
        };
      })
    );

    return health;
  }
}

/**
 * Global provider discovery instance
 */
export const globalProviderDiscovery = new ProviderDiscovery();