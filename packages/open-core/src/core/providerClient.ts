/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIProvider, ProviderGenerateRequest, ProviderGenerateResponse, ProviderMessage, ProviderTool } from '../providers/index.js';
import { Config } from '../config/config.js';
import { UserTierId } from '../providers/google/code_assist/types.js';
import { ProviderChat } from './providerChat.js';
import { getFolderStructure } from '../utils/getFolderStructure.js';
import { ReadManyFilesTool } from '../tools/read-many-files.js';
import { LoopDetectionService } from '../services/loopDetectionService.js';
import process from 'node:process';
import { 
  ServerGeminiStreamEvent, 
  GeminiEventType, 
  Turn,
  ChatCompressionInfo 
} from './turn.js';

/**
 * Provider-agnostic client that replaces GeminiClient
 * Uses AIProvider interface instead of ContentGenerator
 */
export class ProviderClient {
  private chat?: ProviderChat;
  private aiProvider?: AIProvider;
  private model: string;
  private embeddingModel: string;
  private sessionTurnCount = 0;
  private readonly MAX_TURNS = 100;
  private loopDetector: LoopDetectionService;

  constructor(
    private config: Config,
    model?: string,
    embeddingModel?: string
  ) {
    this.model = model || config.getModel();
    this.embeddingModel = embeddingModel || config.getEmbeddingModel();
    this.loopDetector = new LoopDetectionService(config);
  }

  async initialize(aiProvider: AIProvider): Promise<void> {
    this.aiProvider = aiProvider;
    this.chat = await this.startChat();
  }

  getAIProvider(): AIProvider {
    if (!this.aiProvider) {
      throw new Error('AI provider not initialized');
    }
    return this.aiProvider;
  }

  getUserTier(): UserTierId | undefined {
    // This will need to be handled differently for each provider
    // For now, return undefined since it's Google-specific
    return undefined;
  }

  async addHistory(message: ProviderMessage): Promise<void> {
    this.getChat().addHistory(message);
  }

  getChat(): ProviderChat {
    if (!this.chat) {
      throw new Error('Chat not initialized');
    }
    return this.chat;
  }

  isInitialized(): boolean {
    return this.chat !== undefined && this.aiProvider !== undefined;
  }

  getHistory(): ProviderMessage[] {
    return this.getChat().getHistory();
  }

  setHistory(history: ProviderMessage[]): void {
    this.getChat().setHistory(history);
  }

  async setTools(): Promise<void> {
    const toolRegistry = await this.config.getToolRegistry();
    const toolDeclarations = toolRegistry.getFunctionDeclarations();
    
    // Convert tool declarations to provider format
    const tools: ProviderTool[] = toolDeclarations
      .filter(decl => decl.name) // Only include tools with names
      .map(decl => ({
        type: 'function' as const,
        function: {
          name: decl.name!,
          description: decl.description || '',
          parameters: decl.parameters || {}
        }
      }));
    
    this.getChat().setTools(tools);
  }

  async resetChat(): Promise<void> {
    this.chat = await this.startChat();
  }

  /**
   * Send a message and get streaming response
   */
  async *sendMessageStream(
    message: string | ProviderMessage[], 
    abortSignal?: AbortSignal,
    promptId?: string
  ): AsyncGenerator<ServerGeminiStreamEvent> {
    const chat = this.getChat();
    
    // Convert input to messages format
    let messages: ProviderMessage[];
    if (typeof message === 'string') {
      messages = [...chat.getHistory(), { role: 'user', content: message }];
    } else {
      messages = message;
    }

    const request: ProviderGenerateRequest = {
      messages,
      model: this.model,
      tools: chat.getTools(),
      stream: true
    };

    try {
      for await (const chunk of this.aiProvider!.generateContentStream(request)) {
        // Convert provider response to Gemini stream event format
        const event = this.convertProviderResponseToGeminiEvent(chunk, promptId);
        yield event;
        
        // Update chat history with the response
        if (chunk.choices?.[0]?.delta) {
          chat.addStreamChunk(chunk.choices[0].delta);
        }
      }
    } catch (error) {
      // Convert provider errors to Gemini format
      yield {
        type: GeminiEventType.Error,
        value: {
          error: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      };
    }

    this.sessionTurnCount++;
  }

  /**
   * Try to compress chat history when it gets too long
   */
  async tryCompressChat(promptId: string = '', forceCompress: boolean = false): Promise<ChatCompressionInfo> {
    const chat = this.getChat();
    const history = chat.getHistory();
    
    if (!forceCompress && history.length < 20) {
      return { originalTokenCount: history.length, newTokenCount: history.length };
    }

    try {
      // Create a compression request
      const compressionPrompt = this.createCompressionPrompt(history);
      const request: ProviderGenerateRequest = {
        messages: [{ role: 'user', content: compressionPrompt }],
        model: this.model,
        max_tokens: 2000
      };

      const response = await this.aiProvider!.generateContent(request);
      const compressedContent = response.choices?.[0]?.message?.content;

      if (compressedContent) {
        // Replace history with compressed version
        const newHistory: ProviderMessage[] = [
          { role: 'system', content: 'Previous conversation summary: ' + compressedContent }
        ];
        chat.setHistory(newHistory);
        
        return {
          originalTokenCount: history.length,
          newTokenCount: newHistory.length
        };
      }
    } catch (error) {
      console.warn('Chat compression failed:', error);
    }

    return { originalTokenCount: history.length, newTokenCount: history.length };
  }

  private createCompressionPrompt(history: ProviderMessage[]): string {
    const conversation = history.map(msg => 
      `${msg.role}: ${typeof msg.content === 'string' ? msg.content : '[complex content]'}`
    ).join('\n\n');

    return `Please summarize the following conversation, preserving the key context, decisions made, and current state of the discussion. Keep it concise but informative:

${conversation}

Summary:`;
  }

  private async getEnvironment(): Promise<ProviderMessage> {
    const cwd = this.config.getWorkingDir();
    const today = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const platform = process.platform;
    
    const folderStructure = await getFolderStructure(cwd, {
      fileService: this.config.getFileService(),
    });

    let context = `
This is the Open CLI. We are setting up the context for our chat.
Today's date is ${today}.
My operating system is: ${platform}
I'm currently working in the directory: ${cwd}
${folderStructure}
    `.trim();

    // Add full file context if the flag is set
    if (this.config.getFullContext()) {
      try {
        const toolRegistry = await this.config.getToolRegistry();
        const readManyFilesTool = toolRegistry.getTool('read_many_files') as ReadManyFilesTool;
        
        if (readManyFilesTool) {
          const result = await readManyFilesTool.execute(
            {
              paths: ['**/*'],
              useDefaultExcludes: true,
            },
            AbortSignal.timeout(30000),
          );
          
          if (result.llmContent) {
            context += `\n--- Full File Context ---\n${result.llmContent}`;
          }
        }
      } catch (error) {
        console.error('Error reading full file context:', error);
        context += '\n--- Error reading full file context ---';
      }
    }

    return { role: 'system', content: context };
  }

  private async startChat(): Promise<ProviderChat> {
    const envMessage = await this.getEnvironment();
    const toolRegistry = await this.config.getToolRegistry();
    const toolDeclarations = toolRegistry.getFunctionDeclarations();
    
    const tools: ProviderTool[] = toolDeclarations
      .filter(decl => decl.name) // Only include tools with names
      .map(decl => ({
        type: 'function' as const,
        function: {
          name: decl.name!,
          description: decl.description || '',
          parameters: decl.parameters || {}
        }
      }));

    const initialHistory: ProviderMessage[] = [
      envMessage,
      {
        role: 'assistant',
        content: 'Hello! I\'m ready to help you with your development tasks. What would you like to work on?'
      }
    ];

    return new ProviderChat(this.aiProvider!, initialHistory, tools);
  }

  /**
   * Convert provider response to Gemini stream event format for backward compatibility
   */
  private convertProviderResponseToGeminiEvent(
    response: ProviderGenerateResponse,
    promptId?: string
  ): ServerGeminiStreamEvent {
    const choice = response.choices?.[0];
    
    if (!choice) {
      return {
        type: GeminiEventType.Error,
        value: {
          error: {
            message: 'No response choices available'
          }
        }
      };
    }

    if (choice.finish_reason === 'tool_calls' && choice.delta?.tool_calls) {
      return {
        type: GeminiEventType.ToolCallRequest,
        value: {
          callId: choice.delta.tool_calls[0]?.id || 'unknown',
          name: choice.delta.tool_calls[0]?.function?.name || 'unknown',
          args: choice.delta.tool_calls[0]?.function?.arguments ? 
            JSON.parse(choice.delta.tool_calls[0].function.arguments) : {},
          isClientInitiated: false,
          prompt_id: promptId || ''
        }
      };
    }

    if (choice.delta?.content) {
      return {
        type: GeminiEventType.Content,
        value: typeof choice.delta.content === 'string' ? choice.delta.content : 
               choice.delta.content.map(part => part.text || '').join('')
      };
    }

    if (choice.finish_reason === 'stop') {
      return {
        type: GeminiEventType.Content, // Use Content for completion
        value: ''
      };
    }

    return {
      type: GeminiEventType.Content,
      value: ''
    };
  }
}