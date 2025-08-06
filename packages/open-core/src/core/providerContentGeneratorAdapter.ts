/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ContentGenerator,
  ContentGeneratorConfig,
  AuthType
} from './contentGenerator.js';
import {
  GenerateContentParameters,
  GenerateContentResponse,
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  Content,
  Part
} from '@google/genai';
import { 
  AIProvider, 
  ProviderGenerateRequest, 
  ProviderMessage, 
  ProviderTool,
  ProviderError 
} from '../providers/index.js';
import { UserTierId } from '../providers/google/code_assist/types.js';

/**
 * Adapter that makes an AIProvider look like a ContentGenerator
 * This allows gradual migration from ContentGenerator to AIProvider
 */
export class ProviderContentGeneratorAdapter implements ContentGenerator {
  public userTier?: UserTierId;

  constructor(
    private aiProvider: AIProvider,
    private model: string,
    userTier?: UserTierId
  ) {
    this.userTier = userTier;
  }

  async generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse> {
    try {
      const providerRequest = this.convertToProviderRequest(request);
      const providerResponse = await this.aiProvider.generateContent(providerRequest);
      return this.convertToGoogleResponse(providerResponse);
    } catch (error) {
      throw this.convertProviderError(error);
    }
  }

  async generateContentStream(request: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse>> {
    const self = this;
    return (async function* () {
      try {
        const providerRequest = self.convertToProviderRequest(request);
        
        for await (const chunk of self.aiProvider.generateContentStream(providerRequest)) {
          yield self.convertToGoogleResponse(chunk);
        }
      } catch (error) {
        throw self.convertProviderError(error);
      }
    })();
  }

  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    try {
      const messages = this.convertContentsToMessages(request.contents);
      
      const providerRequest = {
        messages,
        model: this.model
      };

      const response = await this.aiProvider.countTokens(providerRequest);
      return {
        totalTokens: response.total_tokens
      };
    } catch (error) {
      throw this.convertProviderError(error);
    }
  }

  async embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse> {
    try {
      // Convert contents to simple string for embedding
      let inputText: string;
      if (typeof request.contents === 'string') {
        inputText = request.contents;
      } else if (Array.isArray(request.contents)) {
        inputText = request.contents.map((c: any) => {
          if (typeof c === 'string') return c;
          if (c.text) return c.text;
          if (c.parts) return c.parts.map((p: any) => p.text || '').join('');
          return '';
        }).join(' ');
      } else {
        const c = request.contents as any;
        if (c.text) {
          inputText = c.text;
        } else if (c.parts) {
          inputText = c.parts.map((p: any) => p.text || '').join('');
        } else {
          inputText = '';
        }
      }
      
      const providerRequest = {
        input: inputText,
        model: request.model || this.model
      };

      const response = await this.aiProvider.embedContent(providerRequest);
      return {
        embeddings: [{
          values: response.data[0]?.embedding || []
        }]
      };
    } catch (error) {
      throw this.convertProviderError(error);
    }
  }

  /**
   * Convert Google GenerateContentParameters to provider format
   */
  private convertToProviderRequest(request: GenerateContentParameters): ProviderGenerateRequest {
    const messages = this.convertContentsToMessages(request.contents);

    return {
      messages,
      model: request.model || this.model
    };
  }

  /**
   * Convert Google Contents to provider messages
   */
  private convertContentsToMessages(contents: any): ProviderMessage[] {
    // Handle string input by converting to Content array
    if (typeof contents === 'string') {
      return [{
        role: 'user',
        content: contents
      }];
    }
    
    // Handle single Content object or Part
    if (!Array.isArray(contents)) {
      // If it's a Part, convert to Content
      if ('text' in contents || 'inlineData' in contents) {
        contents = [{ role: 'user', parts: [contents] }];
      } else {
        contents = [contents];
      }
    }
    return contents.map((content: any) => {
      const message: ProviderMessage = {
        role: content.role === 'model' ? 'assistant' : content.role as any,
        content: this.convertPartsToContent(content.parts || [])
      };

      // Handle tool calls and responses
      const toolCalls = content.parts?.filter((p: any) => p.functionCall).map((p: any) => ({
        id: `call_${Date.now()}_${Math.random()}`,
        type: 'function' as const,
        function: {
          name: p.functionCall!.name || 'unknown',
          arguments: JSON.stringify(p.functionCall!.args || {})
        }
      }));

      if (toolCalls && toolCalls.length > 0) {
        message.tool_calls = toolCalls;
      }

      // Handle function responses
      const functionResponse = content.parts?.find((p: any) => p.functionResponse);
      if (functionResponse) {
        message.role = 'tool';
        message.name = functionResponse.functionResponse!.name;
        message.content = JSON.stringify(functionResponse.functionResponse!.response);
        // Note: tool_call_id would need to be tracked separately
      }

      return message;
    });
  }

  /**
   * Convert Google Parts to content string or content parts
   */
  private convertPartsToContent(parts: Part[]): string {
    return parts.map((part: any) => {
      if (part.text) return part.text;
      if (part.inlineData) return '[Image data]';
      if (part.functionCall) return `[Function call: ${part.functionCall.name}]`;
      if (part.functionResponse) return `[Function response: ${part.functionResponse.name}]`;
      return '[Unknown content]';
    }).join(' ').trim();
  }

  /**
   * Convert Google tools to provider tools
   */
  private convertGoogleToolsToProvider(tools: any[]): ProviderTool[] {
    const providerTools: ProviderTool[] = [];
    
    for (const tool of tools) {
      if (tool.functionDeclarations) {
        for (const decl of tool.functionDeclarations) {
          providerTools.push({
            type: 'function',
            function: {
              name: decl.name,
              description: decl.description || '',
              parameters: decl.parameters || {}
            }
          });
        }
      }
    }
    
    return providerTools;
  }

  /**
   * Convert provider response to Google format
   */
  private convertToGoogleResponse(providerResponse: any): GenerateContentResponse {
    const choice = providerResponse.choices?.[0];
    
    if (!choice) {
      return {
        candidates: [],
        text: '',
        data: undefined,
        functionCalls: undefined,
        executableCode: undefined,
        codeExecutionResult: undefined
      } as GenerateContentResponse;
    }

    const parts: Part[] = [];
    const message = choice.message || choice.delta;

    if (message?.content) {
      parts.push({ text: message.content });
    }

    if (message?.tool_calls) {
      for (const toolCall of message.tool_calls) {
        parts.push({
          functionCall: {
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments)
          }
        });
      }
    }

    const candidate = {
      content: {
        role: 'model' as const,
        parts
      },
      finishReason: this.convertFinishReason(choice.finish_reason)
    };

    const response: GenerateContentResponse = {
      candidates: [candidate],
      text: candidate.content.parts.find(p => p.text)?.text || '',
      data: undefined,
      functionCalls: undefined,
      executableCode: undefined,
      codeExecutionResult: undefined
    };

    if (providerResponse.usage) {
      response.usageMetadata = {
        promptTokenCount: providerResponse.usage.prompt_tokens,
        candidatesTokenCount: providerResponse.usage.completion_tokens,
        totalTokenCount: providerResponse.usage.total_tokens
      };
    }

    return response;
  }

  /**
   * Convert provider finish reason to Google format
   */
  private convertFinishReason(reason?: string): any {
    switch (reason) {
      case 'stop': return 'STOP';
      case 'length': return 'MAX_TOKENS';
      case 'tool_calls': return 'STOP'; // Google doesn't have separate tool_calls reason
      case 'content_filter': return 'SAFETY';
      default: return 'STOP'; // Default to STOP instead of undefined
    }
  }

  /**
   * Convert provider errors to Google-style errors
   */
  private convertProviderError(error: any): Error {
    if (error instanceof ProviderError) {
      const googleError = new Error(error.message);
      (googleError as any).status = error.statusCode;
      (googleError as any).code = error.code;
      return googleError;
    }
    return error;
  }
}

/**
 * Factory function to create a ContentGenerator from an AIProvider
 */
export function createContentGeneratorFromProvider(
  aiProvider: AIProvider,
  config: ContentGeneratorConfig,
  userTier?: UserTierId
): ContentGenerator {
  return new ProviderContentGeneratorAdapter(aiProvider, config.model, userTier);
}