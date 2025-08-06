/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupProviders, globalProviderRegistry } from './setup.js';
import { ProviderConfigManager } from '../config/providerConfig.js';

describe('Provider System Integration', () => {
  let configManager: ProviderConfigManager;

  beforeEach(() => {
    // Clear any existing providers
    vi.clearAllMocks();
    configManager = new ProviderConfigManager();
  });

  describe('Provider Registration', () => {
    it('should register built-in providers', () => {
      setupProviders();

      expect(globalProviderRegistry.isAIProviderAvailable('google')).toBe(true);
      expect(globalProviderRegistry.isAIProviderAvailable('openai')).toBe(true);
      expect(globalProviderRegistry.isAuthProviderAvailable('google')).toBe(true);
      expect(globalProviderRegistry.isAuthProviderAvailable('openai')).toBe(true);
    });

    it('should list available providers', () => {
      setupProviders();

      const aiProviders = globalProviderRegistry.listAIProviders();
      const authProviders = globalProviderRegistry.listAuthProviders();

      expect(aiProviders.map(p => p.name)).toContain('google');
      expect(aiProviders.map(p => p.name)).toContain('openai');
      expect(authProviders).toContain('google');
      expect(authProviders).toContain('openai');
    });
  });

  describe('Configuration Management', () => {
    it('should create configuration from environment variables', () => {
      // Mock environment variables
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.OPENAI_MODEL = 'gpt-4o';

      const config = configManager.createFromEnvironment();

      expect(config.provider).toBe('openai');
      expect(config.model).toBe('gpt-4o');
      expect(config.auth.type).toBe('api_key');
      expect(config.auth.apiKey).toBe('sk-test123');

      // Clean up
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;
    });

    it('should prefer OpenAI over Google when both are available', () => {
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.GEMINI_API_KEY = 'AI-test456';

      const config = configManager.createFromEnvironment();

      expect(config.provider).toBe('openai');

      // Clean up
      delete process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
    });

    it('should fall back to Google when OpenAI is not available', () => {
      process.env.GEMINI_API_KEY = 'AI-test456';

      const config = configManager.createFromEnvironment();

      expect(config.provider).toBe('google');
      expect(config.auth.type).toBe('api_key');
      expect(config.auth.apiKey).toBe('AI-test456');

      // Clean up
      delete process.env.GEMINI_API_KEY;
    });

    it('should use Google Cloud configuration when available', () => {
      process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
      process.env.GOOGLE_CLOUD_LOCATION = 'us-central1';
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/service-account.json';

      const config = configManager.createFromEnvironment();

      expect(config.provider).toBe('google');
      expect(config.auth.type).toBe('service_account');
      expect(config.auth.serviceAccountPath).toBe('/path/to/service-account.json');

      // Clean up
      delete process.env.GOOGLE_CLOUD_PROJECT;
      delete process.env.GOOGLE_CLOUD_LOCATION;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    });
  });

  describe('Provider Factory Validation', () => {
    beforeEach(() => {
      setupProviders();
    });

    it('should validate OpenAI provider configuration', () => {
      const factory = globalProviderRegistry.getAIProviderFactory('openai');
      expect(factory).toBeDefined();

      const validConfig = {
        name: 'openai',
        model: 'gpt-4o',
        apiKey: 'sk-test123'
      };

      const validation = factory!.validateConfig(validConfig);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid OpenAI configuration', () => {
      const factory = globalProviderRegistry.getAIProviderFactory('openai');
      expect(factory).toBeDefined();

      const invalidConfig = {
        name: 'openai',
        model: 'gpt-4o'
        // Missing API key
      };

      const validation = factory!.validateConfig(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('API key is required (OPENAI_API_KEY environment variable or config.apiKey)');
    });

    it('should validate Google provider configuration', () => {
      const factory = globalProviderRegistry.getAIProviderFactory('google');
      expect(factory).toBeDefined();

      const validConfig = {
        name: 'google',
        model: 'gemini-1.5-pro',
        apiKey: 'AI-test123'
      };

      const validation = factory!.validateConfig(validConfig);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should provide warning for suspicious API key formats', () => {
      const openaiFactory = globalProviderRegistry.getAIProviderFactory('openai');
      const googleFactory = globalProviderRegistry.getAIProviderFactory('google');

      const suspiciousOpenAIConfig = {
        name: 'openai',
        model: 'gpt-4o',
        apiKey: 'AI-looks-like-google-key' // Wrong format for OpenAI
      };

      const suspiciousGoogleConfig = {
        name: 'google',
        model: 'gemini-1.5-pro',
        apiKey: 'sk-looks-like-openai-key' // Wrong format for Google
      };

      const openaiValidation = openaiFactory!.validateConfig(suspiciousOpenAIConfig);
      const googleValidation = googleFactory!.validateConfig(suspiciousGoogleConfig);

      expect(openaiValidation.warnings).toContain('OpenAI API keys typically start with "sk-"');
      expect(googleValidation.warnings).toContain('Google API keys typically start with "AI"');
    });
  });

  describe('Provider Information', () => {
    beforeEach(() => {
      setupProviders();
    });

    it('should provide complete provider information', () => {
      const openaiInfo = configManager.getProviderInfo('openai');
      const googleInfo = configManager.getProviderInfo('google');

      expect(openaiInfo).toBeDefined();
      expect(openaiInfo!.name).toBe('openai');
      expect(openaiInfo!.models).toContain('gpt-4o');
      expect(openaiInfo!.capabilities.streaming).toBe(true);

      expect(googleInfo).toBeDefined();
      expect(googleInfo!.name).toBe('google');
      expect(googleInfo!.models).toContain('gemini-1.5-pro');
      expect(googleInfo!.capabilities.toolCalling).toBe(true);
    });

    it('should list all available providers', () => {
      const availableProviders = configManager.getAvailableProviders();

      expect(availableProviders).toContain('google');
      expect(availableProviders).toContain('openai');
      expect(availableProviders.length).toBeGreaterThanOrEqual(2);
    });
  });
});