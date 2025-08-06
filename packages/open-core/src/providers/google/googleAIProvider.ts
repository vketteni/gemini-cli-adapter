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
  ProviderMessage,
  ProviderTool,
  ProviderToolCall
} from '../types.js';

import {
  GoogleGenAI,
  GenerateContentParameters,
  GenerateContentResponse as GoogleGenerateResponse,
  CountTokensParameters,
  CountTokensResponse as GoogleCountTokensResponse,
  Content,
  Part,
  Tool as GoogleTool,
  FunctionCall,
  FunctionResponse
} from '@google/genai';

/**
 * Google AI Provider implementation that translates between Google's format and the standard format
 */
export class GoogleAIProvider implements AIProvider {
  private genAI: GoogleGenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    
    if (!config.apiKey) {
      throw new ProviderError('API key is required for Google AI provider', 'MISSING_API_KEY');
    }

    this.genAI = new GoogleGenAI({
      apiKey: config.apiKey === '' ? undefined : config.apiKey,
      vertexai: config.options?.vertexai || false
    });
  }

  async generateContent(request: ProviderGenerateRequest): Promise<ProviderGenerateResponse> {
    const googleRequest = this.convertToGoogleRequest(request);
    const models = this.genAI.models;
    
    try {
      const result = await models.generateContent(googleRequest);
      return this.convertFromGoogleResponse(result, request.model, false);
    } catch (error) {
      throw this.handleGoogleError(error);
    }
  }

  async *generateContentStream(request: ProviderGenerateRequest): AsyncGenerator<ProviderGenerateResponse> {
    const googleRequest = this.convertToGoogleRequest(request);
    const models = this.genAI.models;
    
    try {
      const stream = await models.generateContentStream(googleRequest);
      
      for await (const chunk of stream) {
        yield this.convertFromGoogleResponse(chunk, request.model, true);
      }
    } catch (error) {
      throw this.handleGoogleError(error);
    }
  }

  async countTokens(request: ProviderCountTokensRequest): Promise<ProviderCountTokensResponse> {
    const googleRequest: CountTokensParameters = {
      contents: this.convertMessagesToGoogleContents(request.messages),
      model: request.model
    };

    const models = this.genAI.models;
    
    try {
      const result = await models.countTokens(googleRequest);
      return {
        total_tokens: result.totalTokens || 0,
        prompt_tokens: result.totalTokens || 0 // Google doesn't separate prompt/completion tokens for count
      };
    } catch (error) {
      throw this.handleGoogleError(error);
    }
  }

  async embedContent(request: ProviderEmbedRequest): Promise<ProviderEmbedResponse> {
    // Google uses a different model for embeddings
    const models = this.genAI.models;
    
    try {
      const inputs = Array.isArray(request.input) ? request.input : [request.input];
      const data = await Promise.all(
        inputs.map(async (input, index) => {
          const result = await models.embedContent({ 
            contents: input,
            model: 'embedding-001' // Default embedding model
          });
          return {
            object: 'embedding' as const,
            embedding: result.embeddings?.[0]?.values || [],
            index
          };
        })
      );

      return {
        object: 'list',
        data,
        model: request.model,
        usage: {
          prompt_tokens: inputs.join(' ').split(' ').length, // Rough estimate
          total_tokens: inputs.join(' ').split(' ').length
        }
      };
    } catch (error) {
      throw this.handleGoogleError(error);
    }
  }

  getInfo(): ProviderInfo {
    return {
      name: 'google',
      version: '1.0.0',
      models: [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'embedding-001'
      ],
      capabilities: {
        streaming: true,
        toolCalling: true,
        imageInput: true,
        systemMessages: true,
        embeddings: true,
        maxTokens: 2097152, // 2M tokens for Gemini 1.5
        supportedImageFormats: ['jpeg', 'png', 'webp', 'heic', 'heif']
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
      imageInput: true,
      systemMessages: true,
      embeddings: false,
      maxTokens: 2097152
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
    
    return baseCapabilities;
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test with a simple request
      await this.countTokens({
        messages: [{ role: 'user', content: 'test' }],
        model: 'gemini-1.5-flash'
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert from provider format to Google format
   */
  private convertToGoogleRequest(request: ProviderGenerateRequest): GenerateContentParameters {
    return {
      contents: this.convertMessagesToGoogleContents(request.messages),
      model: request.model
    };
  }

  /**
   * Convert provider messages to Google Contents
   */
  private convertMessagesToGoogleContents(messages: ProviderMessage[]): Content[] {
    const contents: Content[] = [];
    
    for (const message of messages) {
      if (message.role === 'system') {
        // Google handles system messages differently - they go in the system instruction
        continue;
      }

      const parts: Part[] = [];

      if (typeof message.content === 'string') {
        if (message.content) {
          parts.push({ text: message.content });
        }
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'text' && part.text) {
            parts.push({ text: part.text });
          } else if (part.type === 'image_url' && part.image_url) {
            // Convert image URL to Google format
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg', // Default, should be detected
                data: part.image_url.url.split(',')[1] || part.image_url.url
              }
            });
          }
        }
      }

      // Handle tool calls
      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments)
            }
          });
        }
      }

      // Handle tool responses
      if (message.role === 'tool' && message.tool_call_id) {
        parts.push({
          functionResponse: {
            name: message.name || 'unknown',
            response: { content: message.content }
          }
        });
      }

      if (parts.length > 0) {
        contents.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts
        });
      }
    }

    return contents;
  }

  /**
   * Convert provider tools to Google tools
   */
  private convertToolsToGoogle(tools: ProviderTool[]): GoogleTool[] {
    return [{
      functionDeclarations: tools.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }))
    }];
  }

  /**
   * Convert Google response to provider format
   */
  private convertFromGoogleResponse(
    response: GoogleGenerateResponse,
    model: string,
    isStream: boolean
  ): ProviderGenerateResponse {
    const choices = response.candidates?.map((candidate, index) => {
      const parts = candidate.content?.parts || [];
      let content = '';
      const toolCalls: ProviderToolCall[] = [];

      for (const part of parts) {
        if (part.text) {
          content += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call_${Date.now()}_${index}`,
            type: 'function',
            function: {
              name: part.functionCall.name || 'unknown',
              arguments: JSON.stringify(part.functionCall.args || {})
            }
          });
        }
      }

      const message: ProviderMessage = {
        role: 'assistant' as const,
        content: content || undefined
      };

      if (toolCalls.length > 0) {
        message.tool_calls = toolCalls;
      }

      return {
        index,
        message: isStream ? undefined : message,
        delta: isStream ? message : undefined,
        finish_reason: this.convertGoogleFinishReason(candidate.finishReason)
      };
    }) || [];

    return {
      id: `chatcmpl-${Date.now()}`,
      object: isStream ? 'chat.completion.chunk' : 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices,
      usage: response.usageMetadata ? {
        prompt_tokens: response.usageMetadata.promptTokenCount || 0,
        completion_tokens: response.usageMetadata.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata.totalTokenCount || 0
      } : undefined
    };
  }

  /**
   * Convert Google finish reason to OpenAI format
   */
  private convertGoogleFinishReason(reason?: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' | null {
    switch (reason) {
      case 'STOP': return 'stop';
      case 'MAX_TOKENS': return 'length';
      case 'SAFETY': return 'content_filter';
      case 'RECITATION': return 'content_filter';
      default: return null;
    }
  }

  /**
   * Handle Google API errors and convert to ProviderError
   */
  private handleGoogleError(error: any): ProviderError {
    if (error.status === 401) {
      return new ProviderError('Authentication failed', 'AUTH_ERROR', 401, error);
    }
    if (error.status === 429) {
      return new ProviderError('Rate limit exceeded', 'RATE_LIMIT', 429, error);
    }
    if (error.status === 400) {
      return new ProviderError('Invalid request', 'INVALID_REQUEST', 400, error);
    }
    
    return new ProviderError(
      error.message || 'Unknown Google API error',
      'UNKNOWN_ERROR',
      error.status,
      error
    );
  }
}