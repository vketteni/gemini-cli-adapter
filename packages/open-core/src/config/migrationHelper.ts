/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config } from './config.js';
import { ContentGeneratorConfig, AuthType } from '../core/contentGenerator.js';
import { DynamicProviderConfig, ProviderConfigFile } from './dynamicProviderConfig.js';
import { ProviderConfig } from '../providers/types.js';
import { existsSync, promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';

/**
 * Migration helper to transition from legacy to provider system
 */
export class ProviderMigrationHelper {
  private legacyConfigPath: string;
  private newConfigPath: string;

  constructor() {
    this.legacyConfigPath = join(os.homedir(), '.gemini-cli', 'config.json');
    this.newConfigPath = join(os.homedir(), '.open-cli', 'providers.json');
  }

  /**
   * Check if migration is needed
   */
  async needsMigration(): Promise<boolean> {
    // Migration is needed if legacy config exists but new config doesn't
    return existsSync(this.legacyConfigPath) && !existsSync(this.newConfigPath);
  }

  /**
   * Migrate legacy configuration to new provider system
   */
  async migrate(): Promise<DynamicProviderConfig | null> {
    if (!existsSync(this.legacyConfigPath)) {
      return null;
    }

    try {
      // Read legacy configuration
      const legacyContent = await fs.readFile(this.legacyConfigPath, 'utf-8');
      const legacyConfig = JSON.parse(legacyContent);

      // Extract ContentGeneratorConfig if available
      const contentGenConfig = this.extractContentGeneratorConfig(legacyConfig);
      if (!contentGenConfig) {
        return null;
      }

      // Convert to provider configuration
      const providerConfig = this.convertToProviderConfig(contentGenConfig);

      // Create provider file format
      const providerFile = this.convertToProviderFile(providerConfig);

      // Ensure new config directory exists
      const configDir = this.newConfigPath.substring(0, this.newConfigPath.lastIndexOf('/'));
      await fs.mkdir(configDir, { recursive: true });

      // Write new configuration
      await fs.writeFile(this.newConfigPath, JSON.stringify(providerFile, null, 2));

      // Backup legacy config
      await this.backupLegacyConfig();

      return providerConfig;
    } catch (error) {
      console.warn('Migration failed:', error);
      return null;
    }
  }

  /**
   * Extract ContentGeneratorConfig from legacy config
   */
  private extractContentGeneratorConfig(legacyConfig: any): ContentGeneratorConfig | null {
    // Try to find content generator configuration in various places
    if (legacyConfig.contentGenerator) {
      return legacyConfig.contentGenerator;
    }

    if (legacyConfig.ai && legacyConfig.ai.contentGenerator) {
      return legacyConfig.ai.contentGenerator;
    }

    // Try to reconstruct from environment or other config
    const model = legacyConfig.model || process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    const apiKey = legacyConfig.apiKey || process.env.GEMINI_API_KEY;

    if (apiKey) {
      return {
        model,
        authType: AuthType.USE_GEMINI,
        apiKey
      };
    }

    // Check for Google Cloud configuration
    if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION) {
      return {
        model,
        authType: AuthType.USE_VERTEX_AI
      };
    }

    return null;
  }

  /**
   * Convert ContentGeneratorConfig to provider configuration
   */
  private convertToProviderConfig(contentGenConfig: ContentGeneratorConfig): DynamicProviderConfig {
    let providerName = 'google';
    let authType = 'api_key';

    // Map AuthType to provider and auth method
    switch (contentGenConfig.authType) {
      case AuthType.USE_GEMINI:
        providerName = 'google';
        authType = 'api_key';
        break;
      case AuthType.USE_VERTEX_AI:
        providerName = 'google';
        authType = 'service_account';
        break;
      case AuthType.LOGIN_WITH_GOOGLE:
        providerName = 'google';
        authType = 'oauth2';
        break;
      case AuthType.CLOUD_SHELL:
        providerName = 'google';
        authType = 'application_default';
        break;
    }

    const providerConfig: ProviderConfig = {
      name: providerName,
      model: contentGenConfig.model,
      apiKey: contentGenConfig.apiKey
    };

    return {
      primary: {
        provider: providerName,
        config: providerConfig
      },
      settings: {
        timeout: 30000,
        retries: 3,
        enableFallback: false // Conservative default for migrated configs
      }
    };
  }

  /**
   * Convert to provider file format
   */
  private convertToProviderFile(config: DynamicProviderConfig): ProviderConfigFile {
    return {
      version: '1.0.0',
      providers: {
        [config.primary.provider]: {
          enabled: true,
          config: config.primary.config,
          priority: 100
        }
      },
      settings: config.settings
    };
  }

  /**
   * Backup legacy configuration
   */
  private async backupLegacyConfig(): Promise<void> {
    const backupPath = `${this.legacyConfigPath}.backup-${Date.now()}`;
    await fs.copyFile(this.legacyConfigPath, backupPath);
  }

  /**
   * Auto-migrate if needed and return configuration
   */
  async autoMigrate(): Promise<DynamicProviderConfig | null> {
    if (await this.needsMigration()) {
      console.log('Migrating legacy configuration to new provider system...');
      const config = await this.migrate();
      if (config) {
        console.log('Migration completed successfully');
        return config;
      } else {
        console.warn('Migration failed - continuing with auto-detection');
      }
    }

    return null;
  }

  /**
   * Create a migration report
   */
  async createMigrationReport(): Promise<{
    needsMigration: boolean;
    legacyConfigExists: boolean;
    newConfigExists: boolean;
    migrationPossible: boolean;
    recommendations: string[];
  }> {
    const legacyExists = existsSync(this.legacyConfigPath);
    const newExists = existsSync(this.newConfigPath);
    const needsMig = await this.needsMigration();
    
    let migrationPossible = false;
    const recommendations: string[] = [];

    if (legacyExists) {
      try {
        const legacyContent = await fs.readFile(this.legacyConfigPath, 'utf-8');
        const legacyConfig = JSON.parse(legacyContent);
        const contentGenConfig = this.extractContentGeneratorConfig(legacyConfig);
        migrationPossible = !!contentGenConfig;
      } catch {
        migrationPossible = false;
      }
    }

    if (needsMig && migrationPossible) {
      recommendations.push('Run migration to convert legacy configuration');
    } else if (needsMig && !migrationPossible) {
      recommendations.push('Legacy configuration found but cannot be migrated automatically');
      recommendations.push('Consider setting up providers manually');
    } else if (!legacyExists && !newExists) {
      recommendations.push('No configuration found - auto-detection will be used');
    }

    return {
      needsMigration: needsMig,
      legacyConfigExists: legacyExists,
      newConfigExists: newExists,
      migrationPossible,
      recommendations
    };
  }
}

/**
 * Global migration helper instance
 */
export const globalMigrationHelper = new ProviderMigrationHelper();