/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import path from 'path';
import os from 'os';
import { createState } from '../util/state.js';
import { mergeDeep } from '../util/merge.js';
import type { ProviderInstance, ToolPermissions } from '../types/index.js';

/**
 * Core configuration namespace following OpenCode's state-based pattern
 * Provides lazy initialization, hierarchical loading, and environment variable interpolation
 */
export namespace CoreConfig {
  // --- Schema Definitions ---

  export const SessionConfig = z.object({
    compressionThreshold: z.number().min(0).max(1).default(0.9),
    preserveThreshold: z.number().min(0).max(1).default(0.3),
    maxTurns: z.number().int().positive().default(100),
    outputReserve: z.number().int().positive().default(4096),
    enableLocking: z.boolean().default(true),
    enableQueuing: z.boolean().default(true),
    enableRevert: z.boolean().default(true),
  });

  export const ProviderConfig = z.object({
    providers: z.map(z.string(), z.custom<ProviderInstance>()).default(new Map()),
    defaultProvider: z.string().optional(),
  });

  export const ToolConfig = z.object({
    permissions: z.object({
      edit: z.boolean().default(true),
      shell: z.boolean().default(true),
      network: z.boolean().default(true),
      filesystem: z.boolean().default(true),
    }).default({}),
    coreTools: z.array(z.string()).optional(),
    excludeTools: z.array(z.string()).optional(),
    mcpServers: z.record(z.string(), z.any()).optional(),
  });

  export const WorkspaceConfig = z.object({
    projectRoot: z.string().default(() => process.cwd()),
    gitEnabled: z.boolean().default(true),
    customInstructionPaths: z.array(z.string()).default(['CLAUDE.md', 'AGENTS.md', 'CONTEXT.md']),
  });

  export const TelemetryConfig = z.object({
    enabled: z.boolean().default(false),
    endpoint: z.string().optional(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  });

  export const Config = z.object({
    session: SessionConfig,
    providers: ProviderConfig,
    tools: ToolConfig,
    workspace: WorkspaceConfig,
    telemetry: TelemetryConfig,
  });

  export type Info = z.infer<typeof Config>;

  // --- State Management ---

  /**
   * Main configuration state with lazy initialization
   * Follows OpenCode's App.state() pattern
   */
  export const state = createState('core-config', async (): Promise<Info> => {
    let result: Partial<Info> = {};

    // Load environment-based configuration first
    result = mergeDeep(result, await loadFromEnvironment());

    // Load project-based configuration (opencode.json, opencode.jsonc)
    result = mergeDeep(result, await loadFromProject());

    // Load custom config if specified
    const customConfigPath = process.env.OPENCODE_CONFIG;
    if (customConfigPath) {
      result = mergeDeep(result, await loadFromFile(customConfigPath));
    }

    // Validate and return parsed configuration
    return Config.parse(result);
  });

  /**
   * Get the current configuration
   */
  export async function get(): Promise<Info> {
    return state();
  }

  /**
   * Create CLI-optimized configuration
   */
  export async function forCLI(overrides: Partial<Info> = {}): Promise<Info> {
    const baseConfig = await state();
    return mergeDeep(baseConfig, {
      tools: {
        permissions: {
          edit: true,
          shell: true,
          network: true,
          filesystem: true,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create extension-optimized configuration (restricted permissions)
   */
  export async function forExtension(overrides: Partial<Info> = {}): Promise<Info> {
    const baseConfig = await state();
    return mergeDeep(baseConfig, {
      tools: {
        permissions: {
          edit: false,
          shell: false,
          network: false,
          filesystem: true,
        },
      },
      ...overrides,
    });
  }

  // --- Configuration Loading ---

  /**
   * Load configuration from environment variables
   */
  async function loadFromEnvironment(): Promise<Partial<Info>> {
    const providers = new Map<string, ProviderInstance>();
    let defaultProvider: string | undefined;

    // Check for OpenAI
    if (process.env.OPENAI_API_KEY) {
      providers.set('openai', {
        name: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
      });
      if (!defaultProvider) defaultProvider = 'openai';
    }

    // Check for Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      providers.set('anthropic', {
        name: 'anthropic',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
      });
      if (!defaultProvider) defaultProvider = 'anthropic';
    }

    // Check for Google/Gemini
    if (process.env.GEMINI_API_KEY) {
      providers.set('google', {
        name: 'google',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        apiKey: process.env.GEMINI_API_KEY,
      });
      if (!defaultProvider) defaultProvider = 'google';
    }

    return {
      providers: {
        providers,
        defaultProvider,
      },
      workspace: {
        projectRoot: process.cwd(),
        gitEnabled: true,
        customInstructionPaths: ['CLAUDE.md', 'AGENTS.md', 'CONTEXT.md'],
      },
      telemetry: {
        enabled: process.env.TELEMETRY_ENABLED === 'true',
        endpoint: process.env.TELEMETRY_ENDPOINT,
        logLevel: (process.env.LOG_LEVEL as any) || 'info',
      },
    };
  }

  /**
   * Load configuration from project files
   */
  async function loadFromProject(): Promise<Partial<Info>> {
    const cwd = process.cwd();
    let result: Partial<Info> = {};

    // Look for configuration files
    const configFiles = ['opencode.jsonc', 'opencode.json', '.opencode/config.json'];
    
    for (const file of configFiles) {
      const configPath = await findUp(file, cwd);
      if (configPath) {
        result = mergeDeep(result, await loadFromFile(configPath));
      }
    }

    return result;
  }

  /**
   * Load configuration from a specific file
   */
  async function loadFromFile(filepath: string): Promise<Partial<Info>> {
    try {
      // Read file
      const fs = await import('fs/promises');
      let content = await fs.readFile(filepath, 'utf-8');

      // Environment variable interpolation (OpenCode pattern)
      content = content.replace(/\{env:([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || '';
      });

      // File interpolation (OpenCode pattern)
      const fileMatches = content.match(/\{file:[^}]+\}/g);
      if (fileMatches) {
        const configDir = path.dirname(filepath);
        for (const match of fileMatches) {
          let filePath = match.replace(/^\{file:/, '').replace(/\}$/, '');
          if (filePath.startsWith('~/')) {
            filePath = path.join(os.homedir(), filePath.slice(2));
          }
          const resolvedPath = path.isAbsolute(filePath) 
            ? filePath 
            : path.resolve(configDir, filePath);
          
          try {
            const fileContent = await fs.readFile(resolvedPath, 'utf-8');
            content = content.replace(match, JSON.stringify(fileContent).slice(1, -1));
          } catch {
            // Ignore file read errors
          }
        }
      }

      // Parse JSON (with comments support)
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  /**
   * Find a file by walking up the directory tree
   */
  async function findUp(filename: string, startDir: string): Promise<string | null> {
    const fs = await import('fs/promises');
    let currentDir = startDir;
    
    while (true) {
      const filePath = path.join(currentDir, filename);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
          break; // Reached root
        }
        currentDir = parentDir;
      }
    }
    
    return null;
  }
}