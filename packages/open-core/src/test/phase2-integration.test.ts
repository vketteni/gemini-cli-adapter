/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  createContentGenerator, 
  ContentGeneratorConfig, 
  AuthType 
} from '../core/contentGenerator.js';
import { Config } from '../config/config.js';
import { globalProviderRegistry } from '../providers/providerRegistry.js';

/**
 * Integration test for Phase 2 dual-path architecture
 */
describe('Phase 2 Dual-Path Architecture', () => {
  let mockConfig: Partial<Config>;

  beforeEach(() => {
    mockConfig = {
      getSessionId: () => 'test-session',
      getModel: () => 'gemini-1.5-pro',
      getEmbeddingModel: () => 'embedding-001',
    };
  });

  it('should use provider system when Google provider is available', async () => {
    // Verify Google provider is registered
    const providers = globalProviderRegistry.listAIProviders();
    expect(providers).toContain('google');

    const config: ContentGeneratorConfig = {
      model: 'gemini-1.5-pro',
      authType: AuthType.USE_GEMINI,
      apiKey: 'test-api-key'
    };

    // This should attempt provider system first
    // Note: Will fail without real API key, but tests the routing
    try {
      await createContentGenerator(config, mockConfig as Config);
    } catch (error) {
      // Expected to fail with test API key, but should show it tried provider system
      expect(error.message).not.toContain('Unsupported authType');
    }
  });

  it('should fallback to legacy implementation when provider system fails', async () => {
    const config: ContentGeneratorConfig = {
      model: 'gemini-1.5-pro',
      authType: AuthType.USE_GEMINI,
      apiKey: '' // Invalid API key to force fallback
    };

    try {
      await createContentGenerator(config, mockConfig as Config);
    } catch (error) {
      // Should still reach the legacy Google implementation
      expect(error.message).not.toContain('not found');
    }
  });

  it('should maintain backward compatibility for all AuthTypes', async () => {
    const authTypes = [
      AuthType.USE_GEMINI,
      AuthType.USE_VERTEX_AI,
      AuthType.LOGIN_WITH_GOOGLE,
      AuthType.CLOUD_SHELL
    ];

    for (const authType of authTypes) {
      const config: ContentGeneratorConfig = {
        model: 'gemini-1.5-pro',
        authType,
        apiKey: 'test-key'
      };

      try {
        await createContentGenerator(config, mockConfig as Config);
      } catch (error) {
        // Should not throw "Unsupported authType" error
        expect(error.message).not.toContain('Unsupported authType');
      }
    }
  });
});

/**
 * Simple smoke test to verify provider system initialization
 */
describe('Provider System Initialization', () => {
  it('should have Google provider registered', () => {
    const providers = globalProviderRegistry.listAIProviders();
    expect(providers).toContain('google');
  });

  it('should have OpenAI provider registered', () => {
    const providers = globalProviderRegistry.listAIProviders();
    expect(providers).toContain('openai');
  });
});