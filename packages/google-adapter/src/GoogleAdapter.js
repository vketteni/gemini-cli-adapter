export class GoogleAdapter {
    id = 'google-gemini';
    name = 'Google Gemini';
    version = '0.1.0';
    async createSession(config) {
        // TODO: Implement session creation
        throw new Error('Not implemented');
    }
    async *sendMessage(sessionId, message) {
        // TODO: Implement message sending
        throw new Error('Not implemented');
    }
    async getAvailableTools() {
        // TODO: Implement tool discovery
        return [];
    }
    async *executeTools(requests) {
        // TODO: Implement tool execution
        throw new Error('Not implemented');
    }
    async validateConfig(config) {
        // TODO: Implement config validation
        return { valid: true, errors: [], warnings: [] };
    }
    async initialize() {
        // TODO: Implement initialization
    }
    async dispose() {
        // TODO: Implement cleanup
    }
}
//# sourceMappingURL=GoogleAdapter.js.map