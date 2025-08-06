/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleAIProvider } from './googleAIProvider.js';
import { ProviderConfig } from '../types.js';

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
      countTokens: vi.fn(),
      embedContent: vi.fn()
    })
  }))
}));

describe('GoogleAIProvider', () => {
  let provider: GoogleAIProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    config = {
      name: 'google',
      model: 'gemini-1.5-pro',
      apiKey: 'AIzaSyTest123'
    };
    provider = new GoogleAIProvider(config);
  });

  describe('constructor', () => {
    it('should create provider with valid config', () => {
      expect(provider).toBeInstanceOf(GoogleAIProvider);
    });

    it('should throw error without API key', () => {
      const invalidConfig = { ...config, apiKey: undefined };
      expect(() => new GoogleAIProvider(invalidConfig)).toThrow('API key is required');
    });
  });

  describe('getInfo', () => {
    it('should return provider information', () => {
      const info = provider.getInfo();
      expect(info.name).toBe('google');
      expect(info.models).toContain('gemini-1.5-pro');
      expect(info.capabilities.streaming).toBe(true);
      expect(info.capabilities.toolCalling).toBe(true);
    });
  });

  describe('getSupportedModels', () => {
    it('should return list of supported models', () => {
      const models = provider.getSupportedModels();
      expect(models).toContain('gemini-1.5-pro');
      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('embedding-001');
    });
  });

  describe('isModelSupported', () => {
    it('should return true for supported models', () => {
      expect(provider.isModelSupported('gemini-1.5-pro')).toBe(true);
      expect(provider.isModelSupported('gemini-1.5-flash')).toBe(true);
    });

    it('should return false for unsupported models', () => {
      expect(provider.isModelSupported('gpt-4')).toBe(false);
      expect(provider.isModelSupported('unknown-model')).toBe(false);
    });
  });

  describe('getModelCapabilities', () => {
    it('should return capabilities for embedding models', () => {
      const caps = provider.getModelCapabilities('embedding-001');
      expect(caps.streaming).toBe(false);
      expect(caps.toolCalling).toBe(false);
      expect(caps.embeddings).toBe(true);
    });

    it('should return full capabilities for chat models', () => {
      const caps = provider.getModelCapabilities('gemini-1.5-pro');
      expect(caps.streaming).toBe(true);
      expect(caps.toolCalling).toBe(true);
      expect(caps.imageInput).toBe(true);
    });
  });

  describe('generateContent', () => {
    it('should convert provider request to Google format', async () => {
      const mockModel = {
        generateContent: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: 'Hello!' }] },
            finishReason: 'STOP'
          }],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 5,
            totalTokenCount: 15
          }
        })
      };

      vi.mocked(provider['genAI'].getGenerativeModel).mockReturnValue(mockModel as any);

      const request = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        model: 'gemini-1.5-pro'
      };

      const response = await provider.generateContent(request);

      expect(response.choices).toHaveLength(1);
      expect(response.choices[0].message?.content).toBe('Hello!');
      expect(response.choices[0].finish_reason).toBe('stop');
      expect(response.usage?.total_tokens).toBe(15);
    });
  });
});