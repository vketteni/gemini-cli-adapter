/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider } from './openaiAIProvider.js';
import { ProviderConfig } from '../types.js';

// Mock fetch
global.fetch = vi.fn();

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      name: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-test123'
    };
    provider = new OpenAIProvider(config);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should throw error without API key', () => {
      const invalidConfig = { ...config, apiKey: undefined };
      expect(() => new OpenAIProvider(invalidConfig)).toThrow('API key is required');
    });

    it('should use custom base URL if provided', () => {
      const customConfig = { ...config, baseUrl: 'https://custom.openai.com/v1' };
      const customProvider = new OpenAIProvider(customConfig);
      expect(customProvider['baseUrl']).toBe('https://custom.openai.com/v1');
    });
  });

  describe('getInfo', () => {
    it('should return provider information', () => {
      const info = provider.getInfo();
      expect(info.name).toBe('openai');
      expect(info.models).toContain('gpt-4o');
      expect(info.models).toContain('gpt-3.5-turbo');
      expect(info.capabilities.streaming).toBe(true);
      expect(info.capabilities.toolCalling).toBe(true);
    });
  });

  describe('getSupportedModels', () => {
    it('should return list of supported models', () => {
      const models = provider.getSupportedModels();
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('text-embedding-3-large');
    });
  });

  describe('isModelSupported', () => {
    it('should return true for supported models', () => {
      expect(provider.isModelSupported('gpt-4o')).toBe(true);
      expect(provider.isModelSupported('gpt-3.5-turbo')).toBe(true);
    });

    it('should return false for unsupported models', () => {
      expect(provider.isModelSupported('gemini-pro')).toBe(false);
      expect(provider.isModelSupported('unknown-model')).toBe(false);
    });
  });

  describe('getModelCapabilities', () => {
    it('should return capabilities for embedding models', () => {
      const caps = provider.getModelCapabilities('text-embedding-3-large');
      expect(caps.streaming).toBe(false);
      expect(caps.toolCalling).toBe(false);
      expect(caps.embeddings).toBe(true);
    });

    it('should return full capabilities for chat models', () => {
      const caps = provider.getModelCapabilities('gpt-4o');
      expect(caps.streaming).toBe(true);
      expect(caps.toolCalling).toBe(true);
      expect(caps.imageInput).toBe(true);
      expect(caps.maxTokens).toBe(128000);
    });

    it('should return limited capabilities for GPT-3.5', () => {
      const caps = provider.getModelCapabilities('gpt-3.5-turbo');
      expect(caps.imageInput).toBe(false);
      expect(caps.maxTokens).toBe(16384);
    });
  });

  describe('generateContent', () => {
    it('should make correct API request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1234567890,
          model: 'gpt-4o-mini',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you today?'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 8,
            total_tokens: 18
          }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const request = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        model: 'gpt-4o-mini'
      };

      const response = await provider.generateContent(request);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test123',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            ...request,
            stream: false
          })
        })
      );

      expect(response.choices[0].message?.content).toBe('Hello! How can I help you today?');
      expect(response.usage?.total_tokens).toBe(18);
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const request = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        model: 'gpt-4o-mini'
      };

      await expect(provider.generateContent(request)).rejects.toThrow();
    });
  });

  describe('countTokens', () => {
    it('should return rough estimation on API failure', async () => {
      // Mock generateContent to fail
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const request = {
        messages: [{ role: 'user' as const, content: 'Hello world' }],
        model: 'gpt-4o-mini'
      };

      const response = await provider.countTokens(request);

      // Should return rough estimation based on character count
      expect(response.total_tokens).toBeGreaterThan(0);
      expect(response.prompt_tokens).toBeGreaterThan(0);
    });
  });
});