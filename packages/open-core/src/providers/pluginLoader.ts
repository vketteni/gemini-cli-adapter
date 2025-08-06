/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIProviderFactory, AuthProviderFactory } from './index.js';
import { globalProviderRegistry } from './providerRegistry.js';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Provider plugin interface
 */
export interface ProviderPlugin {
  name: string;
  version: string;
  aiProviderFactory?: AIProviderFactory;
  authProviderFactory?: AuthProviderFactory;
  initialize?(): Promise<void>;
  dispose?(): Promise<void>;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  main: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Plugin loader for dynamically loading provider plugins
 */
export class ProviderPluginLoader {
  private loadedPlugins = new Map<string, ProviderPlugin>();
  private pluginPaths = new Set<string>();

  /**
   * Add a directory to search for plugins
   */
  addPluginPath(path: string): void {
    this.pluginPaths.add(resolve(path));
  }

  /**
   * Load a plugin from a specific path
   */
  async loadPlugin(pluginPath: string): Promise<ProviderPlugin> {
    const resolvedPath = resolve(pluginPath);
    
    // Check if plugin is already loaded
    const existingPlugin = this.loadedPlugins.get(resolvedPath);
    if (existingPlugin) {
      return existingPlugin;
    }

    // Validate plugin exists
    if (!existsSync(resolvedPath)) {
      throw new Error(`Plugin not found: ${resolvedPath}`);
    }

    // Load plugin metadata
    const packageJsonPath = join(resolvedPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error(`Plugin package.json not found: ${packageJsonPath}`);
    }

    const metadata: PluginMetadata = JSON.parse(
      await import('fs').then(fs => fs.promises.readFile(packageJsonPath, 'utf-8'))
    );

    // Load the main plugin module
    const mainPath = join(resolvedPath, metadata.main || 'index.js');
    if (!existsSync(mainPath)) {
      throw new Error(`Plugin main file not found: ${mainPath}`);
    }

    // Dynamic import the plugin
    const pluginModule = await import(mainPath);
    const plugin = pluginModule.default || pluginModule;

    if (!plugin || typeof plugin !== 'object') {
      throw new Error(`Invalid plugin export from ${mainPath}`);
    }

    // Validate plugin interface
    this.validatePlugin(plugin, metadata);

    // Initialize plugin if needed
    if (plugin.initialize) {
      await plugin.initialize();
    }

    // Register providers with the global registry
    if (plugin.aiProviderFactory) {
      globalProviderRegistry.registerAIProvider(plugin.name, plugin.aiProviderFactory);
    }

    if (plugin.authProviderFactory) {
      globalProviderRegistry.registerAuthProvider(plugin.name, plugin.authProviderFactory);
    }

    // Store plugin
    this.loadedPlugins.set(resolvedPath, plugin);

    return plugin;
  }

  /**
   * Discover and load plugins from registered paths
   */
  async discoverAndLoadPlugins(): Promise<ProviderPlugin[]> {
    const loadedPlugins: ProviderPlugin[] = [];

    for (const pluginPath of this.pluginPaths) {
      try {
        const plugins = await this.discoverPluginsInPath(pluginPath);
        for (const plugin of plugins) {
          const loadedPlugin = await this.loadPlugin(plugin);
          loadedPlugins.push(loadedPlugin);
        }
      } catch (error) {
        console.warn(`Failed to load plugins from ${pluginPath}:`, error);
      }
    }

    return loadedPlugins;
  }

  /**
   * Discover plugin directories in a path
   */
  private async discoverPluginsInPath(searchPath: string): Promise<string[]> {
    if (!existsSync(searchPath)) {
      return [];
    }

    const fs = await import('fs');
    const entries = await fs.promises.readdir(searchPath, { withFileTypes: true });
    const pluginPaths: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = join(searchPath, entry.name);
        const packageJsonPath = join(pluginPath, 'package.json');
        
        if (existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(
              await fs.promises.readFile(packageJsonPath, 'utf-8')
            );
            
            // Check if this is a provider plugin
            if (this.isProviderPlugin(packageJson)) {
              pluginPaths.push(pluginPath);
            }
          } catch (error) {
            // Skip invalid package.json files
            continue;
          }
        }
      }
    }

    return pluginPaths;
  }

  /**
   * Check if a package is a provider plugin
   */
  private isProviderPlugin(packageJson: any): boolean {
    // Check for provider plugin keywords or dependencies
    const keywords = packageJson.keywords || [];
    const dependencies = { ...packageJson.dependencies, ...packageJson.peerDependencies };

    return (
      keywords.includes('open-cli-provider') ||
      keywords.includes('provider-plugin') ||
      packageJson.name?.startsWith('@open-cli/provider-') ||
      dependencies['@open-cli/core'] ||
      packageJson.openCliProvider === true
    );
  }

  /**
   * Validate plugin interface
   */
  private validatePlugin(plugin: any, metadata: PluginMetadata): void {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error(`Plugin ${metadata.name} must export a 'name' property`);
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error(`Plugin ${metadata.name} must export a 'version' property`);
    }

    // At least one provider factory must be present
    if (!plugin.aiProviderFactory && !plugin.authProviderFactory) {
      throw new Error(
        `Plugin ${metadata.name} must export either 'aiProviderFactory' or 'authProviderFactory'`
      );
    }

    // Validate factory interfaces if present
    if (plugin.aiProviderFactory) {
      const required = ['create', 'validateConfig', 'getRequiredCredentials', 'getProviderInfo'];
      for (const method of required) {
        if (typeof plugin.aiProviderFactory[method] !== 'function') {
          throw new Error(
            `Plugin ${metadata.name} aiProviderFactory missing method: ${method}`
          );
        }
      }
    }

    if (plugin.authProviderFactory) {
      const required = ['create', 'validateConfig', 'getSupportedAuthTypes', 'getRequiredConfig'];
      for (const method of required) {
        if (typeof plugin.authProviderFactory[method] !== 'function') {
          throw new Error(
            `Plugin ${metadata.name} authProviderFactory missing method: ${method}`
          );
        }
      }
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginPath: string): Promise<void> {
    const resolvedPath = resolve(pluginPath);
    const plugin = this.loadedPlugins.get(resolvedPath);
    
    if (!plugin) {
      return;
    }

    // Remove providers from registry
    if (plugin.aiProviderFactory) {
      // Note: ProviderRegistry doesn't have unregister method yet
      // This would need to be added for full plugin unloading support
    }

    // Dispose plugin if needed
    if (plugin.dispose) {
      await plugin.dispose();
    }

    this.loadedPlugins.delete(resolvedPath);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): ProviderPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): ProviderPlugin | undefined {
    return Array.from(this.loadedPlugins.values()).find(p => p.name === name);
  }

  /**
   * Unload all plugins
   */
  async unloadAllPlugins(): Promise<void> {
    const plugins = Array.from(this.loadedPlugins.keys());
    await Promise.all(plugins.map(path => this.unloadPlugin(path)));
  }
}

/**
 * Global plugin loader instance
 */
export const globalPluginLoader = new ProviderPluginLoader();