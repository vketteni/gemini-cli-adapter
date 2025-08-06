/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AIProvider, 
  ProviderMessage, 
  ProviderTool, 
  ProviderGenerateRequest,
  ProviderGenerateResponse 
} from '../providers/index.js';

/**
 * Provider-agnostic chat session management
 * Replaces GeminiChat with support for any AI provider
 */
export class ProviderChat {
  private history: ProviderMessage[] = [];
  private tools: ProviderTool[] = [];
  private pendingAssistantMessage?: Partial<ProviderMessage>;

  constructor(
    private aiProvider: AIProvider,
    initialHistory?: ProviderMessage[],
    tools?: ProviderTool[]
  ) {
    if (initialHistory) {
      this.history = [...initialHistory];
    }
    if (tools) {
      this.tools = [...tools];
    }
  }

  /**
   * Get the current chat history
   */
  getHistory(): ProviderMessage[] {
    return [...this.history];
  }

  /**
   * Set the entire chat history
   */
  setHistory(history: ProviderMessage[]): void {
    this.validateHistory(history);
    this.history = [...history];
  }

  /**
   * Add a single message to history
   */
  addHistory(message: ProviderMessage): void {
    this.validateMessage(message);
    this.history.push(message);
  }

  /**
   * Get the currently configured tools
   */
  getTools(): ProviderTool[] {
    return [...this.tools];
  }

  /**
   * Set the tools available for function calling
   */
  setTools(tools: ProviderTool[]): void {
    this.tools = [...tools];
  }

  /**
   * Send a message and get a complete response
   */
  async sendMessage(content: string): Promise<ProviderGenerateResponse> {
    const userMessage: ProviderMessage = {
      role: 'user',
      content
    };

    const request: ProviderGenerateRequest = {
      messages: [...this.history, userMessage],
      model: this.aiProvider.getSupportedModels()[0], // Use first supported model
      tools: this.tools.length > 0 ? this.tools : undefined
    };

    const response = await this.aiProvider.generateContent(request);
    
    // Add user message and assistant response to history
    this.addHistory(userMessage);
    
    if (response.choices?.[0]?.message) {
      this.addHistory(response.choices[0].message);
    }

    return response;
  }

  /**
   * Send a message and get a streaming response
   */
  async *sendMessageStream(content: string): AsyncGenerator<ProviderGenerateResponse> {
    const userMessage: ProviderMessage = {
      role: 'user',
      content
    };

    const request: ProviderGenerateRequest = {
      messages: [...this.history, userMessage],
      model: this.aiProvider.getSupportedModels()[0],
      tools: this.tools.length > 0 ? this.tools : undefined,
      stream: true
    };

    // Add user message to history immediately
    this.addHistory(userMessage);

    // Initialize pending assistant message
    this.pendingAssistantMessage = {
      role: 'assistant',
      content: '',
      tool_calls: []
    };

    try {
      for await (const chunk of this.aiProvider.generateContentStream(request)) {
        yield chunk;
        
        // Accumulate the streaming response
        if (chunk.choices?.[0]?.delta) {
          this.addStreamChunk(chunk.choices[0].delta);
        }
      }

      // Finalize the assistant message
      if (this.pendingAssistantMessage && this.isValidMessage(this.pendingAssistantMessage)) {
        this.addHistory(this.pendingAssistantMessage as ProviderMessage);
      }
    } finally {
      this.pendingAssistantMessage = undefined;
    }
  }

  /**
   * Add a streaming chunk to the pending assistant message
   */
  addStreamChunk(delta: Partial<ProviderMessage>): void {
    if (!this.pendingAssistantMessage) {
      this.pendingAssistantMessage = {
        role: 'assistant',
        content: '',
        tool_calls: []
      };
    }

    // Accumulate content
    if (delta.content) {
      const currentContent = this.pendingAssistantMessage.content;
      const currentText = typeof currentContent === 'string' ? currentContent : '';
      const newText = typeof delta.content === 'string' ? delta.content : '';
      this.pendingAssistantMessage.content = currentText + newText;
    }

    // Accumulate tool calls
    if (delta.tool_calls) {
      if (!this.pendingAssistantMessage.tool_calls) {
        this.pendingAssistantMessage.tool_calls = [];
      }
      this.pendingAssistantMessage.tool_calls.push(...delta.tool_calls);
    }
  }

  /**
   * Add a tool response to the conversation
   */
  addToolResponse(toolCallId: string, toolName: string, result: any): void {
    const toolMessage: ProviderMessage = {
      role: 'tool',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      tool_call_id: toolCallId,
      name: toolName
    };

    this.addHistory(toolMessage);
  }

  /**
   * Clear the chat history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get a curated history (removing invalid messages)
   */
  getCuratedHistory(): ProviderMessage[] {
    return this.history.filter(msg => this.isValidMessage(msg));
  }

  /**
   * Count tokens in the current history
   */
  async countTokens(): Promise<number> {
    try {
      const response = await this.aiProvider.countTokens({
        messages: this.history,
        model: this.aiProvider.getSupportedModels()[0],
        tools: this.tools.length > 0 ? this.tools : undefined
      });
      return response.total_tokens;
    } catch (error) {
      // Fallback: rough estimation
      const text = this.history.map(msg => 
        typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      ).join(' ');
      return Math.ceil(text.length / 4); // Rough approximation: 1 token ≈ 4 characters
    }
  }

  /**
   * Validate a message format
   */
  private validateMessage(message: ProviderMessage): void {
    if (!message.role || !['system', 'user', 'assistant', 'tool'].includes(message.role)) {
      throw new Error(`Invalid message role: ${message.role}`);
    }

    if (!message.content && !message.tool_calls) {
      throw new Error('Message must have either content or tool_calls');
    }

    if (message.role === 'tool' && !message.tool_call_id) {
      throw new Error('Tool messages must have tool_call_id');
    }
  }

  /**
   * Validate entire history
   */
  private validateHistory(history: ProviderMessage[]): void {
    for (const message of history) {
      this.validateMessage(message);
    }
  }

  /**
   * Check if a message is valid (has content)
   */
  private isValidMessage(message: Partial<ProviderMessage>): boolean {
    if (!message.role) return false;
    
    if (message.content && typeof message.content === 'string' && message.content.trim()) {
      return true;
    }
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      return true;
    }
    
    return false;
  }
}