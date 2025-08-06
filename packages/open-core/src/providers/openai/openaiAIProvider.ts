/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIProvider } from '../aiProvider.js';
import {
  ProviderConfig,
  ProviderGenerateRequest,
  ProviderGenerateResponse,
  ProviderCountTokensRequest,
  ProviderCountTokensResponse,
  ProviderEmbedRequest,
  ProviderEmbedResponse,
  ProviderCapabilities,
  ProviderInfo,
  ProviderError,
  ProviderRateLimitError,
  ProviderAuthError,
  ProviderQuotaError
} from '../types.js';

/**
 * OpenAI Provider implementation - uses OpenAI format natively
 */
export class OpenAIProvider implements AIProvider {
  private config: ProviderConfig;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';

    if (!config.apiKey) {
      throw new ProviderError('API key is required for OpenAI provider', 'MISSING_API_KEY');
    }
  }

  async generateContent(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          stream: false
        })
      });

      return await response.json() as ProviderGenerateResponse;
    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  async *generateContentStream(request: ProviderGenerateRequest): AsyncGenerator<ProviderGenerateResponse> {
    const url = `${this.baseUrl}/chat/completions`;
    
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          stream: true
        })
      });

      if (!response.body) {
        throw new ProviderError('No response body for streaming request', 'NO_RESPONSE_BODY');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') return;

            try {
              const chunk = JSON.parse(data);
              yield chunk;
            } catch (e) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  async countTokens(request: ProviderCountTokensRequest): Promise<ProviderCountTokensResponse> {
    // OpenAI doesn't have a dedicated token counting endpoint
    // We'll make a completion request with max_tokens=1 to get usage stats
    try {
      const response = await this.generateContent({
        ...request,
        max_tokens: 1,
        stream: false
      });

      return {
        total_tokens: response.usage?.total_tokens || 0,
        prompt_tokens: response.usage?.prompt_tokens || 0
      };
    } catch (error) {
      // Fallback: rough estimation based on text length
      const text = request.messages.map(m => 
        typeof m.content === 'string' ? m.content : 
        Array.isArray(m.content) ? m.content.map(p => p.text || '').join(' ') : ''
      ).join(' ');
      
      // Rough approximation: 1 token ≈ 4 characters
      const estimatedTokens = Math.ceil(text.length / 4);
      
      return {
        total_tokens: estimatedTokens,
        prompt_tokens: estimatedTokens
      };
    }
  }

  async embedContent(request: ProviderEmbedRequest): Promise<ProviderEmbedResponse> {
    const url = `${this.baseUrl}/embeddings`;
    
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(request)
      });

      return await response.json() as ProviderEmbedResponse;
    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  getInfo(): ProviderInfo {
    return {
      name: 'openai',
      version: '1.0.0',
      models: [
        'gpt-4o', 
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'text-embedding-3-large',
        'text-embedding-3-small',
        'text-embedding-ada-002'
      ],
      capabilities: {
        streaming: true,
        toolCalling: true,
        imageInput: true,
        systemMessages: true,
        embeddings: true,
        maxTokens: 128000, // GPT-4 Turbo context length
        supportedImageFormats: ['jpeg', 'png', 'gif', 'webp']
      }
    };
  }

  getSupportedModels(): string[] {
    return this.getInfo().models || [];
  }

  isModelSupported(model: string): boolean {
    return this.getSupportedModels().includes(model);
  }

  getModelCapabilities(model: string): ProviderCapabilities {
    const baseCapabilities = this.getInfo().capabilities || {
      streaming: true,
      toolCalling: true,
      imageInput: false,
      systemMessages: true,
      embeddings: false,
      maxTokens: 4096
    };
    
    // Adjust capabilities based on specific model
    if (model.includes('embedding')) {
      return {
        ...baseCapabilities,
        streaming: false,
        toolCalling: false,
        imageInput: false,
        systemMessages: false,
        embeddings: true
      };
    }

    if (model === 'gpt-3.5-turbo') {
      return {
        ...baseCapabilities,
        imageInput: false,
        maxTokens: 16384
      };
    }

    if (model.includes('gpt-4o')) {
      return {
        ...baseCapabilities,
        maxTokens: 128000
      };
    }
    
    return baseCapabilities;
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test with a simple request
      await this.countTokens({
        messages: [{ role: 'user', content: 'test' }],
        model: 'gpt-3.5-turbo'
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Make an HTTP request to OpenAI API with proper headers
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'User-Agent': 'Open-CLI/1.0.0',
      ...((options.headers as Record<string, string>) || {})
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(this.config.timeout || 30000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    return response;
  }

  /**
   * Handle OpenAI API errors and convert to appropriate ProviderError types
   */
  private handleOpenAIError(error: any): ProviderError {
    if (error.message?.includes('401')) {
      return new ProviderAuthError('Invalid API key or authentication failed', error);
    }

    if (error.message?.includes('429')) {
      // Try to extract retry-after from error message
      const retryAfterMatch = error.message.match(/retry-after[:\s]+(\d+)/i);
      const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1]) : undefined;
      
      if (error.message?.includes('quota')) {
        return new ProviderQuotaError('API quota exceeded', error);
      } else {
        return new ProviderRateLimitError('Rate limit exceeded', retryAfter, error);
      }
    }

    if (error.message?.includes('400')) {
      return new ProviderError('Invalid request format or parameters', 'INVALID_REQUEST', 400, error);
    }

    if (error.message?.includes('500')) {
      return new ProviderError('OpenAI server error', 'SERVER_ERROR', 500, error);
    }

    if (error.message?.includes('503')) {
      return new ProviderError('OpenAI service temporarily unavailable', 'SERVICE_UNAVAILABLE', 503, error);
    }

    // Network or other errors
    if (error.name === 'AbortError') {
      return new ProviderError('Request timeout', 'TIMEOUT', undefined, error);
    }

    return new ProviderError(
      error.message || 'Unknown OpenAI API error',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
}