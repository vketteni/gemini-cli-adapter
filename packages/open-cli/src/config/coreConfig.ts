/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreConfig } from '@open-cli/core';
import { LoadedSettings } from './settings.js';
import { CliArgs } from './config.js';

/**
 * Creates Core configuration from CLI arguments and settings
 * This replaces the complex adapter configuration system with direct Core config
 */
export async function createCoreConfig(args: CliArgs, settings: LoadedSettings): Promise<CoreConfig.Info> {
  // Environment-based provider detection
  const providers = new Map();
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.set('anthropic', {
      name: 'anthropic',
      model: args.model || 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  
  if (process.env.OPENAI_API_KEY) {
    providers.set('openai', {
      name: 'openai', 
      model: args.model || 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.set('google', {
      name: 'google',
      model: args.model || 'gemini-1.5-pro', 
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  // Determine default provider from settings or environment
  let defaultProvider = 'anthropic'; // Safe default
  if (settings.merged.preferredProvider) {
    defaultProvider = settings.merged.preferredProvider;
  } else if (process.env.DEFAULT_AI_PROVIDER) {
    defaultProvider = process.env.DEFAULT_AI_PROVIDER;
  } else if (providers.has('anthropic')) {
    defaultProvider = 'anthropic';
  } else if (providers.has('openai')) {
    defaultProvider = 'openai';
  } else if (providers.has('google')) {
    defaultProvider = 'google';
  }

  return {
    providers: {
      providers,
      defaultProvider
    },
    workspace: {
      projectRoot: process.cwd(),
      customInstructionPaths: ['CLAUDE.md', 'README.md', 'GEMINI.md'],
      ignorePatterns: [
        'node_modules/',
        '.git/',
        'dist/',
        'build/',
        '*.log',
        '.env*'
      ]
    },
    tools: {
      permissions: {
        edit: settings.merged.allowEditing !== false,
        shell: settings.merged.allowShell !== false,
        network: settings.merged.allowNetwork !== false,
        filesystem: settings.merged.allowFilesystem !== false,
      },
      exclusions: settings.merged.excludeTools || []
    },
    session: {
      compressionThreshold: 0.8, // Compress when 80% of context is full
      preserveThreshold: 0.2, // Preserve last 20% of messages
      maxTurns: 100,
      outputReserve: 4000, // Reserve tokens for output
      enableLocking: true,
      enableQueuing: true,
      enableRevert: true
    },
    debug: args.debug || settings.merged.debug || false
  };
}

/**
 * Validates that API keys are configured for at least one provider
 */
export function validateApiKeys(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    missing.push('At least one AI provider API key (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY)');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Gets available providers based on configured API keys
 */
export function getAvailableProviders(): string[] {
  const providers: string[] = [];
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push('anthropic');
  }
  
  if (process.env.OPENAI_API_KEY) {
    providers.push('openai');
  }
  
  if (process.env.GEMINI_API_KEY) {
    providers.push('google');
  }
  
  return providers;
}