/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRegistry } from './providerRegistry.js';
import { AIProviderFactory, AuthProviderFactory } from './index.js';

// Mock implementations
const mockAIProvider = {
  generateContent: vi.fn(),
  generateContentStream: vi.fn(),
  countTokens: vi.fn(),
  embedContent: vi.fn(),
  getInfo: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0', models: [], capabilities: {} }),
  getSupportedModels: vi.fn().mockReturnValue(['test-model']),
  isModelSupported: vi.fn().mockReturnValue(true),
  getModelCapabilities: vi.fn(),
  validateConfig: vi.fn().mockResolvedValue(true)
};

const mockAuthProvider = {
  authenticate: vi.fn(),
  refreshCredentials: vi.fn(),
  clearCredentials: vi.fn(),
  validateCredentials: vi.fn().mockResolvedValue(true),
  getAuthStatus: vi.fn(),
  getAuthType: vi.fn().mockReturnValue('test'),
  requiresBrowser: vi.fn().mockReturnValue(false),
  getAuthHeaders: vi.fn().mockResolvedValue({})
};

const mockAIProviderFactory: AIProviderFactory = {
  create: vi.fn().mockResolvedValue(mockAIProvider),
  validateConfig: vi.fn().mockReturnValue({ valid: true, errors: [] }),
  getRequiredCredentials: vi.fn().mockReturnValue([]),
  getProviderInfo: vi.fn().mockReturnValue({ name: 'test', version: '1.0.0', models: [], capabilities: {} })
};

const mockAuthProviderFactory: AuthProviderFactory = {
  create: vi.fn().mockResolvedValue(mockAuthProvider),
  validateConfig: vi.fn().mockReturnValue({ valid: true, errors: [] }),
  getSupportedAuthTypes: vi.fn().mockReturnValue(['test']),
  getRequiredConfig: vi.fn().mockReturnValue([])
};

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
    vi.clearAllMocks();
  });

  describe('AI Provider Registration', () => {
    it('should register AI provider factory', () => {
      registry.registerAIProvider('test', mockAIProviderFactory);
      expect(registry.isAIProviderAvailable('test')).toBe(true);
    });

    it('should create AI provider instance', async () => {
      registry.registerAIProvider('test', mockAIProviderFactory);
      
      const config = {
        name: 'test',
        model: 'test-model',
        apiKey: 'test-key'
      };

      const provider = await registry.getAIProvider('test', config);
      
      expect(mockAIProviderFactory.create).toHaveBeenCalledWith(config);
      expect(provider).toBe(mockAIProvider);
    });

    it('should validate config before creating provider', async () => {
      const invalidFactory = {
        ...mockAIProviderFactory,
        validateConfig: vi.fn().mockReturnValue({ valid: false, errors: ['Invalid config'] })
      };

      registry.registerAIProvider('test', invalidFactory);
      
      const config = {
        name: 'test',
        model: 'test-model'
      };

      await expect(registry.getAIProvider('test', config)).rejects.toThrow('Invalid configuration');
    });

    it('should throw error for unknown provider', async () => {
      await expect(registry.getAIProvider('unknown')).rejects.toThrow('AI provider \'unknown\' not found');
    });

    it('should cache provider instances', async () => {
      registry.registerAIProvider('test', mockAIProviderFactory);
      
      const config = {
        name: 'test',
        model: 'test-model',
        apiKey: 'test-key'
      };

      const provider1 = await registry.getAIProvider('test', config);
      const provider2 = await registry.getAIProvider('test', config);
      
      expect(provider1).toBe(provider2);
      expect(mockAIProviderFactory.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auth Provider Registration', () => {
    it('should register auth provider factory', () => {
      registry.registerAuthProvider('test', mockAuthProviderFactory);
      expect(registry.isAuthProviderAvailable('test')).toBe(true);
    });

    it('should create auth provider instance', async () => {
      registry.registerAuthProvider('test', mockAuthProviderFactory);
      
      const config = {
        type: 'test',
        apiKey: 'test-key'
      };

      const provider = await registry.getAuthProvider('test', config);
      
      expect(mockAuthProviderFactory.create).toHaveBeenCalledWith(config);
      expect(provider).toBe(mockAuthProvider);
    });
  });

  describe('Provider Listing', () => {
    it('should list available AI providers', () => {
      registry.registerAIProvider('test1', mockAIProviderFactory);
      registry.registerAIProvider('test2', mockAIProviderFactory);
      
      const providers = registry.listAIProviders();
      
      expect(providers).toHaveLength(2);
      expect(providers.map(p => p.name)).toContain('test1');
      expect(providers.map(p => p.name)).toContain('test2');
    });

    it('should list available auth providers', () => {
      registry.registerAuthProvider('test1', mockAuthProviderFactory);
      registry.registerAuthProvider('test2', mockAuthProviderFactory);
      
      const providers = registry.listAuthProviders();
      
      expect(providers).toContain('test1');
      expect(providers).toContain('test2');
    });
  });

  describe('Provider Disposal', () => {
    it('should dispose all providers', async () => {
      const disposableAIProvider = {
        ...mockAIProvider,
        dispose: vi.fn()
      };

      const disposableAuthProvider = {
        ...mockAuthProvider,
        dispose: vi.fn()
      };

      const aiFactory = {
        ...mockAIProviderFactory,
        create: vi.fn().mockResolvedValue(disposableAIProvider)
      };

      const authFactory = {
        ...mockAuthProviderFactory,
        create: vi.fn().mockResolvedValue(disposableAuthProvider)
      };

      registry.registerAIProvider('test', aiFactory);
      registry.registerAuthProvider('test', authFactory);

      // Create instances
      await registry.getAIProvider('test', { name: 'test' });
      await registry.getAuthProvider('test', { type: 'test' });

      // Dispose all
      await registry.dispose();

      expect(disposableAIProvider.dispose).toHaveBeenCalled();
      expect(disposableAuthProvider.dispose).toHaveBeenCalled();
    });

    it('should remove specific provider instance', async () => {
      const disposableProvider = {
        ...mockAIProvider,
        dispose: vi.fn()
      };

      const factory = {
        ...mockAIProviderFactory,
        create: vi.fn().mockResolvedValue(disposableProvider)
      };

      registry.registerAIProvider('test', factory);

      const config = { name: 'test' };
      await registry.getAIProvider('test', config);

      await registry.removeProvider('ai', 'test', config);

      expect(disposableProvider.dispose).toHaveBeenCalled();
    });
  });
});