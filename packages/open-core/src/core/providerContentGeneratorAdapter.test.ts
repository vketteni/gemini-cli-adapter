/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderContentGeneratorAdapter, createContentGeneratorFromProvider } from './providerContentGeneratorAdapter.js';
import { AIProvider } from '../providers/index.js';

// Mock AI Provider
const mockAIProvider: AIProvider = {
  generateContent: vi.fn(),
  generateContentStream: vi.fn(),
  countTokens: vi.fn(),
  embedContent: vi.fn(),
  getInfo: vi.fn().mockReturnValue({
    name: 'test',
    version: '1.0.0',
    models: ['test-model'],
    capabilities: {}
  }),
  getSupportedModels: vi.fn().mockReturnValue(['test-model']),
  isModelSupported: vi.fn().mockReturnValue(true),
  getModelCapabilities: vi.fn(),
  validateConfig: vi.fn().mockResolvedValue(true)
};

describe('ProviderContentGeneratorAdapter', () => {
  let adapter: ProviderContentGeneratorAdapter;

  beforeEach(() => {
    adapter = new ProviderContentGeneratorAdapter(mockAIProvider, 'test-model');
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create adapter with AI provider', () => {
      expect(adapter).toBeInstanceOf(ProviderContentGeneratorAdapter);
    });

    it('should set user tier if provided', () => {
      const adapterWithTier = new ProviderContentGeneratorAdapter(mockAIProvider, 'test-model', 'paid');
      expect(adapterWithTier.userTier).toBe('paid');
    });
  });

  describe('generateContent', () => {
    it('should convert Google format to provider format and back', async () => {
      const mockProviderResponse = {
        id: 'test-123',
        object: 'chat.completion' as const,
        created: 1234567890,
        model: 'test-model',
        choices: [{
          index: 0,
          message: {
            role: 'assistant' as const,
            content: 'Hello!'
          },
          finish_reason: 'stop' as const
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      };

      vi.mocked(mockAIProvider.generateContent).mockResolvedValue(mockProviderResponse);

      const googleRequest = {
        contents: [{
          role: 'user' as const,
          parts: [{ text: 'Hello' }]
        }]
      };

      const result = await adapter.generateContent(googleRequest);

      expect(mockAIProvider.generateContent).toHaveBeenCalledWith({
        messages: [{
          role: 'user',
          content: 'Hello'
        }],
        model: 'test-model',
        tools: undefined,
        temperature: undefined,
        max_tokens: undefined,
        stop: undefined
      });

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates![0].content.parts[0]).toEqual({ text: 'Hello!' });
      expect(result.usageMetadata?.totalTokenCount).toBe(15);
    });

    it('should handle tool calls', async () => {
      const mockProviderResponse = {
        id: 'test-123',
        object: 'chat.completion' as const,
        created: 1234567890,
        model: 'test-model',
        choices: [{
          index: 0,
          message: {
            role: 'assistant' as const,
            content: '',
            tool_calls: [{
              id: 'call_123',
              type: 'function' as const,
              function: {
                name: 'get_weather',
                arguments: '{"location": "San Francisco"}'
              }
            }]
          },
          finish_reason: 'tool_calls' as const
        }]
      };

      vi.mocked(mockAIProvider.generateContent).mockResolvedValue(mockProviderResponse);

      const googleRequest = {
        contents: [{
          role: 'user' as const,
          parts: [{ text: 'What is the weather?' }]
        }]
      };

      const result = await adapter.generateContent(googleRequest);

      expect(result.candidates![0].content.parts).toContainEqual({
        functionCall: {
          name: 'get_weather',
          args: { location: 'San Francisco' }
        }
      });
    });
  });

  describe('countTokens', () => {
    it('should convert request and response format', async () => {
      vi.mocked(mockAIProvider.countTokens).mockResolvedValue({
        total_tokens: 25,
        prompt_tokens: 25
      });

      const googleRequest = {
        contents: [{
          role: 'user' as const,
          parts: [{ text: 'Count these tokens' }]
        }]
      };

      const result = await adapter.countTokens(googleRequest);

      expect(mockAIProvider.countTokens).toHaveBeenCalledWith({
        messages: [{
          role: 'user',
          content: 'Count these tokens'
        }],
        model: 'test-model',
        tools: undefined
      });

      expect(result.totalTokens).toBe(25);
    });
  });

  describe('embedContent', () => {
    it('should convert request and response format', async () => {
      vi.mocked(mockAIProvider.embedContent).mockResolvedValue({
        object: 'list',
        data: [{
          object: 'embedding',
          embedding: [0.1, 0.2, 0.3],
          index: 0
        }],
        model: 'test-model',
        usage: {
          prompt_tokens: 5,
          total_tokens: 5
        }
      });

      const googleRequest = {
        content: 'Embed this text',
        model: 'embedding-model'
      };

      const result = await adapter.embedContent(googleRequest);

      expect(mockAIProvider.embedContent).toHaveBeenCalledWith({
        input: 'Embed this text',
        model: 'embedding-model'
      });

      expect(result.embedding.values).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('generateContentStream', () => {
    it('should handle streaming responses', async () => {
      const mockStreamChunks = [
        {
          id: 'test-123',
          object: 'chat.completion.chunk' as const,
          created: 1234567890,
          model: 'test-model',
          choices: [{
            index: 0,
            delta: { content: 'Hello' },
            finish_reason: null
          }]
        },
        {
          id: 'test-123',
          object: 'chat.completion.chunk' as const,
          created: 1234567890,
          model: 'test-model',
          choices: [{
            index: 0,
            delta: { content: ' world!' },
            finish_reason: 'stop' as const
          }]
        }
      ];

      async function* mockStreamGenerator() {
        for (const chunk of mockStreamChunks) {
          yield chunk;
        }
      }

      vi.mocked(mockAIProvider.generateContentStream).mockReturnValue(mockStreamGenerator());

      const googleRequest = {
        contents: [{
          role: 'user' as const,
          parts: [{ text: 'Hello' }]
        }]
      };

      const results = [];
      for await (const chunk of await adapter.generateContentStream(googleRequest)) {
        results.push(chunk);
      }

      expect(results).toHaveLength(2);
      expect(results[0].candidates![0].content.parts[0]).toEqual({ text: 'Hello' });
      expect(results[1].candidates![0].content.parts[0]).toEqual({ text: ' world!' });
    });
  });

  describe('createContentGeneratorFromProvider', () => {
    it('should create adapter from provider and config', () => {
      const config = {
        model: 'test-model',
        authType: 'api_key' as any
      };

      const generator = createContentGeneratorFromProvider(mockAIProvider, config, 'free');

      expect(generator).toBeInstanceOf(ProviderContentGeneratorAdapter);
      expect(generator.userTier).toBe('free');
    });
  });
});