import { CoreAdapter, ChatConfig, ChatEvent, ToolMetadata, ToolRequest, ToolEvent, AdapterConfig, ValidationResult } from '@gemini-cli-adapter/core-interface';
export declare class GoogleAdapter implements CoreAdapter {
    readonly id = "google-gemini";
    readonly name = "Google Gemini";
    readonly version = "0.1.0";
    createSession(config: ChatConfig): Promise<string>;
    sendMessage(sessionId: string, message: string): AsyncIterable<ChatEvent>;
    getAvailableTools(): Promise<ToolMetadata[]>;
    executeTools(requests: ToolRequest[]): AsyncIterable<ToolEvent>;
    validateConfig(config: AdapterConfig): Promise<ValidationResult>;
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=GoogleAdapter.d.ts.map