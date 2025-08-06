/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config } from './config.js';
import { globalDynamicProviderConfig, DynamicProviderConfig } from './dynamicProviderConfig.js';
import { ProviderContentGeneratorAdapter, createContentGeneratorFromProvider } from '../core/providerContentGeneratorAdapter.js';
import { ContentGenerator, ContentGeneratorConfig, AuthType } from '../core/contentGenerator.js';
import { AIProvider } from '../providers/index.js';

/**
 * Integration layer between new provider system and existing Config class
 */
export class ConfigProviderIntegration {
  private config: Config;
  private providerConfig?: DynamicProviderConfig;
  private currentProvider?: AIProvider;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Initialize provider system integration
   */
  async initialize(): Promise<void> {
    // Initialize dynamic provider configuration
    this.providerConfig = await globalDynamicProviderConfig.initialize();

    // Create AI provider
    this.currentProvider = await globalDynamicProviderConfig.createAIProviderWithFallback();
  }

  /**
   * Get ContentGenerator compatible with existing code
   */
  async getContentGenerator(): Promise<ContentGenerator> {
    if (!this.currentProvider || !this.providerConfig) {
      throw new Error('Provider system not initialized');
    }

    // Convert provider config to ContentGeneratorConfig format
    const contentGenConfig = this.convertToContentGeneratorConfig();

    // Create adapter that makes AIProvider look like ContentGenerator
    return createContentGeneratorFromProvider(
      this.currentProvider,
      contentGenConfig
    );
  }

  /**
   * Convert provider config to legacy ContentGeneratorConfig
   */
  private convertToContentGeneratorConfig(): ContentGeneratorConfig {
    if (!this.providerConfig) {
      throw new Error('Provider configuration not available');
    }

    const primaryConfig = this.providerConfig.primary.config;
    
    // Map provider auth to legacy AuthType
    let authType: AuthType;
    switch (this.providerConfig.primary.provider) {
      case 'openai':
        authType = AuthType.USE_GEMINI; // Reuse for API key auth
        break;
      case 'google':
        // Determine Google auth type based on config
        if (primaryConfig.apiKey) {
          authType = AuthType.USE_GEMINI;
        } else {
          authType = AuthType.LOGIN_WITH_GOOGLE;
        }
        break;
      default:
        authType = AuthType.USE_GEMINI; // Default to API key
    }

    return {
      model: primaryConfig.model || 'default',
      authType,
      apiKey: primaryConfig.apiKey
    };
  }

  /**
   * Update Config to use provider system
   */
  async enhanceConfig(): Promise<void> {
    if (!this.providerConfig || !this.currentProvider) {
      await this.initialize();
    }

    // Override GeminiClient creation to use provider system
    const originalGetGeminiClient = this.config.getGeminiClient.bind(this.config);
    
    this.config.getGeminiClient = () => {
      // Return a client that uses the provider system
      return this.createProviderBasedClient();
    };

    // Override refreshAuth to use provider auth
    const originalRefreshAuth = this.config.refreshAuth.bind(this.config);
    
    this.config.refreshAuth = async (authType: AuthType) => {
      // Handle auth refresh through provider system
      await this.handleProviderAuth(authType);
    };
  }

  /**
   * Create a client that bridges to the provider system
   */
  private createProviderBasedClient(): any {
    if (!this.currentProvider) {
      throw new Error('Provider not initialized');
    }

    // Create a minimal client that delegates to the provider
    return {
      generateContent: (request: any) => this.currentProvider!.generateContent(request),
      generateContentStream: (request: any) => this.currentProvider!.generateContentStream(request),
      countTokens: (request: any) => this.currentProvider!.countTokens(request),
      embedContent: (request: any) => this.currentProvider!.embedContent(request),
      
      // Legacy methods for compatibility
      getContentGenerator: () => this.getContentGenerator(),
      setTools: () => Promise.resolve(),
      resetChat: () => Promise.resolve(),
      getChat: () => ({
        getHistory: () => [],
        setHistory: () => {},
        addHistory: () => {}
      })
    };
  }

  /**
   * Handle authentication through provider system
   */
  private async handleProviderAuth(authType: AuthType): Promise<void> {
    // Map legacy auth type to provider configuration
    const providerName = this.getProviderForAuthType(authType);
    
    if (providerName && providerName !== this.providerConfig?.primary.provider) {
      // Switch to different provider if needed
      await globalDynamicProviderConfig.switchProvider(providerName);
      this.providerConfig = globalDynamicProviderConfig.getCurrentConfig();
      this.currentProvider = await globalDynamicProviderConfig.createAIProviderWithFallback();
    }
  }

  /**
   * Map legacy AuthType to provider name
   */
  private getProviderForAuthType(authType: AuthType): string | null {
    switch (authType) {
      case AuthType.USE_GEMINI:
      case AuthType.USE_VERTEX_AI:
      case AuthType.LOGIN_WITH_GOOGLE:
      case AuthType.CLOUD_SHELL:
        return 'google';
      default:
        return null;
    }
  }

  /**
   * Get current provider information
   */
  getCurrentProviderInfo(): {
    name: string;
    model: string;
    capabilities: any;
  } | null {
    if (!this.currentProvider || !this.providerConfig) {
      return null;
    }

    const info = this.currentProvider.getInfo();
    return {
      name: info.name,
      model: this.providerConfig.primary.config.model || 'default',
      capabilities: info.capabilities
    };
  }

  /**
   * Switch to a different provider
   */
  async switchProvider(providerName: string, config?: any): Promise<void> {
    await globalDynamicProviderConfig.switchProvider(providerName, config);
    this.providerConfig = globalDynamicProviderConfig.getCurrentConfig();
    this.currentProvider = await globalDynamicProviderConfig.createAIProviderWithFallback();
    
    // Re-enhance config with new provider
    await this.enhanceConfig();
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<any> {
    return await globalDynamicProviderConfig.getProviderHealth();
  }

  /**
   * Refresh provider configuration
   */
  async refreshProviderConfig(): Promise<void> {
    this.providerConfig = await globalDynamicProviderConfig.refreshConfiguration();
    this.currentProvider = await globalDynamicProviderConfig.createAIProviderWithFallback();
  }

  /**
   * Test if provider system is working
   */
  async testProviderSystem(): Promise<boolean> {
    try {
      if (!this.currentProvider) {
        return false;
      }

      // Test with a simple token count request
      await this.currentProvider.countTokens({
        messages: [{ role: 'user', content: 'test' }],
        model: this.providerConfig?.primary.config.model || 'default'
      });

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Helper function to enhance existing Config with provider system
 */
export async function enhanceConfigWithProviders(config: Config): Promise<ConfigProviderIntegration> {
  const integration = new ConfigProviderIntegration(config);
  await integration.initialize();
  await integration.enhanceConfig();
  return integration;
}