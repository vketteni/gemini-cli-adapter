/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderInstance, ToolPermissions } from '../types/index.js';

export interface CoreConfigParams {
  session?: Partial<SessionConfigParams>;
  providers?: Partial<ProviderConfigParams>;
  tools?: Partial<ToolConfigParams>;
  workspace?: Partial<WorkspaceConfigParams>;
  telemetry?: Partial<TelemetryConfigParams>;
}

export class CoreConfig {
  readonly session: SessionConfig;
  readonly providers: ProviderConfig;
  readonly tools: ToolConfig;
  readonly workspace: WorkspaceConfig;
  readonly telemetry: TelemetryConfig;

  constructor(params: CoreConfigParams = {}) {
    this.session = new SessionConfig(params.session);
    this.providers = new ProviderConfig(params.providers);
    this.tools = new ToolConfig(params.tools);
    this.workspace = new WorkspaceConfig(params.workspace);
    this.telemetry = new TelemetryConfig(params.telemetry);
  }

  static fromEnvironment(): CoreConfig {
    return new CoreConfig({
      providers: ProviderConfig.fromEnvironment(),
      workspace: WorkspaceConfig.fromEnvironment(),
      telemetry: TelemetryConfig.fromEnvironment()
    });
  }

  static forCLI(overrides: Partial<CoreConfigParams> = {}): CoreConfig {
    const envConfig = this.fromEnvironment();
    return new CoreConfig({
      ...envConfig,
      ...overrides,
      session: { ...envConfig.session, ...overrides.session },
      tools: { 
        ...envConfig.tools, 
        permissions: { edit: true, shell: true, network: true, filesystem: true }, 
        ...overrides.tools 
      }
    });
  }

  static forExtension(overrides: Partial<CoreConfigParams> = {}): CoreConfig {
    const envConfig = this.fromEnvironment();
    return new CoreConfig({
      ...envConfig,
      ...overrides,
      tools: { 
        ...envConfig.tools, 
        permissions: { edit: false, shell: false, network: false, filesystem: true }, 
        ...overrides.tools 
      }
    });
  }
}

// Session Configuration
export interface SessionConfigParams {
  compressionThreshold?: number;
  preserveThreshold?: number;
  maxTurns?: number;
  outputReserve?: number;
  enableLocking?: boolean;
  enableQueuing?: boolean;
  enableRevert?: boolean;
}

export class SessionConfig {
  readonly compressionThreshold: number;
  readonly preserveThreshold: number;
  readonly maxTurns: number;
  readonly outputReserve: number;
  readonly enableLocking: boolean;
  readonly enableQueuing: boolean;
  readonly enableRevert: boolean;

  constructor(params: SessionConfigParams = {}) {
    this.compressionThreshold = params.compressionThreshold ?? 0.9;
    this.preserveThreshold = params.preserveThreshold ?? 0.3;
    this.maxTurns = params.maxTurns ?? 100;
    this.outputReserve = params.outputReserve ?? 4096;
    this.enableLocking = params.enableLocking ?? true;
    this.enableQueuing = params.enableQueuing ?? true;
    this.enableRevert = params.enableRevert ?? true;
  }
}

// Provider Configuration
export interface ProviderConfigParams {
  providers?: Map<string, ProviderInstance>;
  defaultProvider?: string;
}

export class ProviderConfig {
  private providers = new Map<string, ProviderInstance>();
  private defaultProvider?: string;

  constructor(params: ProviderConfigParams = {}) {
    if (params.providers) {
      this.providers = new Map(params.providers);
    }
    this.defaultProvider = params.defaultProvider;
  }

  registerProvider(name: string, provider: ProviderInstance): void {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  getProvider(name: string): ProviderInstance {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found`);
    }
    return provider;
  }

  getDefaultProvider(): ProviderInstance {
    if (!this.defaultProvider) {
      throw new Error('No default provider configured');
    }
    return this.getProvider(this.defaultProvider);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static fromEnvironment(): ProviderConfigParams {
    const providers = new Map<string, ProviderInstance>();
    let defaultProvider: string | undefined;

    // Check for OpenAI
    if (process.env.OPENAI_API_KEY) {
      providers.set('openai', {
        name: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL
      });
      if (!defaultProvider) defaultProvider = 'openai';
    }

    // Check for Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      providers.set('anthropic', {
        name: 'anthropic',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL
      });
      if (!defaultProvider) defaultProvider = 'anthropic';
    }

    // Check for Google
    if (process.env.GEMINI_API_KEY) {
      providers.set('google', {
        name: 'google',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
        apiKey: process.env.GEMINI_API_KEY
      });
      if (!defaultProvider) defaultProvider = 'google';
    }

    return { providers, defaultProvider };
  }
}

// Tool Configuration
export interface ToolConfigParams {
  permissions?: ToolPermissions;
  coreTools?: string[];
  excludeTools?: string[];
  mcpServers?: Record<string, any>;
}

export class ToolConfig {
  readonly permissions: ToolPermissions;
  readonly coreTools?: string[];
  readonly excludeTools?: string[];
  readonly mcpServers?: Record<string, any>;

  constructor(params: ToolConfigParams = {}) {
    this.permissions = params.permissions ?? { edit: true, shell: true, network: true, filesystem: true };
    this.coreTools = params.coreTools;
    this.excludeTools = params.excludeTools;
    this.mcpServers = params.mcpServers;
  }
}

// Workspace Configuration
export interface WorkspaceConfigParams {
  projectRoot?: string;
  gitEnabled?: boolean;
  customInstructionPaths?: string[];
}

export class WorkspaceConfig {
  readonly projectRoot: string;
  readonly gitEnabled: boolean;
  readonly customInstructionPaths: string[];

  constructor(params: WorkspaceConfigParams = {}) {
    this.projectRoot = params.projectRoot ?? process.cwd();
    this.gitEnabled = params.gitEnabled ?? true;
    this.customInstructionPaths = params.customInstructionPaths ?? ['CLAUDE.md', 'AGENTS.md', 'CONTEXT.md'];
  }

  static fromEnvironment(): WorkspaceConfigParams {
    return {
      projectRoot: process.cwd(),
      gitEnabled: true,
      customInstructionPaths: ['CLAUDE.md', 'AGENTS.md', 'CONTEXT.md']
    };
  }
}

// Telemetry Configuration
export interface TelemetryConfigParams {
  enabled?: boolean;
  endpoint?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class TelemetryConfig {
  readonly enabled: boolean;
  readonly endpoint?: string;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(params: TelemetryConfigParams = {}) {
    this.enabled = params.enabled ?? false;
    this.endpoint = params.endpoint;
    this.logLevel = params.logLevel ?? 'info';
  }

  static fromEnvironment(): TelemetryConfigParams {
    return {
      enabled: process.env.TELEMETRY_ENABLED === 'true',
      endpoint: process.env.TELEMETRY_ENDPOINT,
      logLevel: (process.env.LOG_LEVEL as any) ?? 'info'
    };
  }
}