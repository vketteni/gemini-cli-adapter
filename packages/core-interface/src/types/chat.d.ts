/**
 * Chat-related type definitions
 */
export interface ChatConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}
export interface ChatEvent {
    type: 'content' | 'thinking' | 'error' | 'done';
    data: unknown;
    timestamp: Date;
}
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
//# sourceMappingURL=chat.d.ts.map