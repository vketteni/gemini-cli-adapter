/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalProviderDiscovery } from '../providers/providerDiscovery.js';
import { globalProviderRegistry } from '../providers/providerRegistry.js';
import { ProviderConfig, ProviderInfo } from '../providers/types.js';
import { AIProvider, AuthProvider } from '../providers/index.js';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';

/**
 * Dynamic provider configuration with auto-detection and fallbacks
 */
export interface DynamicProviderConfig {
  /** Primary provider configuration */
  primary: {
    provider: string;
    config: ProviderConfig;
  };
  
  /** Fallback providers in order of preference */
  fallbacks?: {
    provider: string;
    config: ProviderConfig;
  }[];
  
  /** Provider-specific settings */
  settings?: {
    timeout?: number;
    retries?: number;
    enableFallback?: boolean;
  };
}

/**
 * Configuration file format
 */
export interface ProviderConfigFile {
  version: string;
  providers: {
    [providerName: string]: {
      enabled: boolean;
      config: Partial<ProviderConfig>;
      priority?: number;
    };
  };
  settings?: {
    autoDetect?: boolean;
    timeout?: number;
    retries?: number;
    enableFallback?: boolean;
  };
}

/**
 * Dynamic provider configuration manager
 */
export class DynamicProviderConfigManager {
  private configPath: string;
  private currentConfig?: DynamicProviderConfig;

  constructor(configPath?: string) {
    this.configPath = configPath || join(os.homedir(), '.open-cli', 'providers.json');
  }

  /**
   * Initialize provider system with automatic configuration
   */
  async initialize(): Promise<DynamicProviderConfig> {
    await globalProviderDiscovery.initialize();

    // Try to load saved configuration
    let config = await this.loadSavedConfig();
    
    if (!config) {
      // Auto-detect providers if no saved config
      config = await this.autoDetectConfiguration();
      
      if (config) {
        // Save auto-detected configuration
        await this.saveConfiguration(config);
      }
    }

    if (!config) {
      throw new Error('No providers available or configured. Please check your credentials.');
    }

    // Validate configuration
    await this.validateConfiguration(config);

    this.currentConfig = config;
    return config;
  }

  /**
   * Auto-detect provider configuration
   */
  async autoDetectConfiguration(): Promise<DynamicProviderConfig | null> {
    const detection = await globalProviderDiscovery.autoDetectProvider();
    if (!detection) return null;

    // Find additional providers for fallbacks
    const allProviders = globalProviderDiscovery.getAvailableProviders();
    const fallbacks: { provider: string; config: ProviderConfig }[] = [];

    for (const provider of allProviders) {
      if (provider.name === detection.provider) continue;

      const config = await this.detectProviderConfig(provider.name);
      if (config) {
        fallbacks.push({ provider: provider.name, config });
      }
    }

    return {
      primary: detection,
      fallbacks: fallbacks.slice(0, 2), // Limit to 2 fallbacks
      settings: {
        timeout: 30000,
        retries: 3,
        enableFallback: true
      }
    };
  }

  /**
   * Load saved configuration from file
   */
  private async loadSavedConfig(): Promise<DynamicProviderConfig | null> {
    if (!existsSync(this.configPath)) {
      return null;
    }

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const fileConfig: ProviderConfigFile = JSON.parse(content);
      
      return this.convertFileConfigToDynamic(fileConfig);
    } catch (error) {
      console.warn('Failed to load provider configuration:', error);
      return null;
    }
  }

  /**
   * Convert file format to dynamic configuration
   */
  private convertFileConfigToDynamic(fileConfig: ProviderConfigFile): DynamicProviderConfig | null {
    const enabledProviders = Object.entries(fileConfig.providers)
      .filter(([_, config]) => config.enabled)
      .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0));

    if (enabledProviders.length === 0) {
      return null;
    }

    const [primaryName, primaryConfig] = enabledProviders[0];
    const primary = {
      provider: primaryName,
      config: {
        name: primaryName,
        ...primaryConfig.config
      } as ProviderConfig
    };

    const fallbacks = enabledProviders.slice(1, 3).map(([name, config]) => ({
      provider: name,
      config: {
        name,
        ...config.config
      } as ProviderConfig
    }));

    return {
      primary,
      fallbacks,
      settings: fileConfig.settings
    };
  }

  /**
   * Save configuration to file
   */
  async saveConfiguration(config: DynamicProviderConfig): Promise<void> {
    const fileConfig: ProviderConfigFile = {
      version: '1.0.0',
      providers: {},
      settings: config.settings
    };

    // Add primary provider
    fileConfig.providers[config.primary.provider] = {
      enabled: true,
      config: config.primary.config,
      priority: 100
    };

    // Add fallback providers
    if (config.fallbacks) {
      config.fallbacks.forEach((fallback, index) => {
        fileConfig.providers[fallback.provider] = {
          enabled: true,
          config: fallback.config,
          priority: 90 - index * 10
        };
      });
    }

    // Ensure config directory exists
    const configDir = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
    await fs.mkdir(configDir, { recursive: true });

    // Write configuration
    await fs.writeFile(this.configPath, JSON.stringify(fileConfig, null, 2));
  }

  /**
   * Validate configuration
   */
  private async validateConfiguration(config: DynamicProviderConfig): Promise<void> {
    // Validate primary provider
    await this.validateProviderConfig(config.primary.provider, config.primary.config);

    // Validate fallback providers
    if (config.fallbacks) {
      for (const fallback of config.fallbacks) {
        try {
          await this.validateProviderConfig(fallback.provider, fallback.config);
        } catch (error) {
          console.warn(`Fallback provider ${fallback.provider} validation failed:`, error);
        }
      }
    }
  }

  /**
   * Validate a specific provider configuration
   */
  private async validateProviderConfig(providerName: string, config: ProviderConfig): Promise<void> {
    const factory = globalProviderRegistry.getAIProviderFactory(providerName);
    if (!factory) {
      throw new Error(`Provider factory not found: ${providerName}`);
    }

    const validation = factory.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration for ${providerName}: ${validation.errors.join(', ')}`);
    }
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

    // Check for credentials in environment
    for (const credential of credentials) {
      if (!credential.required) continue;

      const value = process.env[credential.envVar || ''];
      if (!value) return null;

      (config as any)[credential.name] = value;
    }

    // Validate configuration
    const validation = factory.validateConfig(config);
    if (!validation.valid) return null;

    return config;
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(providerName: string): string {
    const defaults: Record<string, string> = {
      'openai': 'gpt-4o-mini',
      'google': 'gemini-1.5-pro',
      'anthropic': 'claude-3-sonnet-20240229'
    };
    return defaults[providerName] || 'default';
  }

  /**
   * Get current configuration
   */
  getCurrentConfig(): DynamicProviderConfig | undefined {
    return this.currentConfig;
  }

  /**
   * Create AI provider from current configuration
   */
  async createAIProvider(): Promise<AIProvider> {
    if (!this.currentConfig) {
      throw new Error('Provider configuration not initialized');
    }

    return await globalProviderRegistry.getAIProvider(
      this.currentConfig.primary.provider,
      this.currentConfig.primary.config
    );
  }

  /**
   * Create AI provider with fallback support
   */
  async createAIProviderWithFallback(): Promise<AIProvider & { getFallbackProvider?: () => Promise<AIProvider> }> {
    const primaryProvider = await this.createAIProvider();

    if (!this.currentConfig?.settings?.enableFallback || !this.currentConfig.fallbacks?.length) {
      return primaryProvider;
    }

    // Enhance provider with fallback capability
    const enhancedProvider = primaryProvider as any;
    const fallbacks = this.currentConfig.fallbacks;

    enhancedProvider.getFallbackProvider = async () => {
      for (const fallback of fallbacks) {
        try {
          return await globalProviderRegistry.getAIProvider(fallback.provider, fallback.config);
        } catch (error) {
          console.warn(`Fallback provider ${fallback.provider} failed:`, error);
          continue;
        }
      }
      throw new Error('All fallback providers failed');
    };

    return enhancedProvider;
  }

  /**
   * Create auth provider from current configuration
   */
  async createAuthProvider(): Promise<AuthProvider> {
    if (!this.currentConfig) {
      throw new Error('Provider configuration not initialized');
    }

    const authConfig = {
      type: 'api_key', // Default auth type
      ...this.currentConfig.primary.config
    };

    return await globalProviderRegistry.getAuthProvider(
      this.currentConfig.primary.provider,
      authConfig
    );
  }

  /**
   * Refresh configuration by re-detecting providers
   */
  async refreshConfiguration(): Promise<DynamicProviderConfig> {
    const newConfig = await this.autoDetectConfiguration();
    if (newConfig) {
      await this.saveConfiguration(newConfig);
      this.currentConfig = newConfig;
    }
    return this.currentConfig!;
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<Record<string, any>> {
    return await globalProviderDiscovery.getProviderHealth();
  }

  /**
   * Switch to a different provider
   */
  async switchProvider(providerName: string, config?: Partial<ProviderConfig>): Promise<void> {
    if (!this.currentConfig) {
      throw new Error('Provider configuration not initialized');
    }

    const fullConfig = {
      name: providerName,
      model: this.getDefaultModel(providerName),
      ...config
    } as ProviderConfig;

    // Validate new configuration
    await this.validateProviderConfig(providerName, fullConfig);

    // Update current config
    this.currentConfig.primary = {
      provider: providerName,
      config: fullConfig
    };

    // Save updated configuration
    await this.saveConfiguration(this.currentConfig);
  }
}

/**
 * Global dynamic provider configuration manager
 */
export const globalDynamicProviderConfig = new DynamicProviderConfigManager();