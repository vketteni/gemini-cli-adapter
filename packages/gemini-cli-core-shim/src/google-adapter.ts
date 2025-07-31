import { CoreAdapter, ChatService, ToolingService, WorkspaceService, AuthService, MemoryService, SettingsService } from "@gemini-cli/core-interface";
import { 
  Config, 
  GeminiClient, 
  executeToolCall, 
  ToolCallRequestInfo,
  ToolRegistry,
  getProjectTempDir,
  isGitRepository,
  loadServerHierarchicalMemory,
  AuthType,
  isTelemetrySdkInitialized,
  shutdownTelemetry,
  checkCommandPermissions,
  clearCachedCredentialFile,
  Logger,
  sessionId,
  ShellExecutionService,
  CodeAssistServer,
  mcpServerRequiresOAuth,
  MCPOAuthProvider
} from "@gemini-cli/core-copy";

class GoogleChatService implements ChatService {
    private config: Config;
    private geminiClient: GeminiClient;

    constructor(config: Config) {
        this.config = config;
        this.geminiClient = config.getGeminiClient();
    }

    async sendMessageStream(request: any, prompt_id: string): Promise<AsyncIterable<any>> {
        const chat = this.geminiClient.getChat();
        return chat.sendMessageStream(request, prompt_id);
    }

    async getHistory(): Promise<any[]> {
        const chat = this.geminiClient.getChat();
        return chat.getHistory();
    }

    async setHistory(history: any[]): Promise<void> {
        const chat = this.geminiClient.getChat();
        chat.setHistory(history);
    }

    async resetChat(): Promise<void> {
        await this.geminiClient.resetChat();
    }

    async tryCompressChat(promptId?: string, forceCompress?: boolean): Promise<any> {
        return this.geminiClient.tryCompressChat(promptId, forceCompress);
    }
}

class GoogleToolingService implements ToolingService {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    async getTool(name: string): Promise<any | undefined> {
        const toolRegistry = await this.config.getToolRegistry();
        return toolRegistry.getTool(name);
    }

    async getAllTools(): Promise<any[]> {
        const toolRegistry = await this.config.getToolRegistry();
        return toolRegistry.getAllTools();
    }

    async executeToolCall(toolCall: any): Promise<any> {
        const toolRegistry = await this.config.getToolRegistry();
        return executeToolCall(this.config, toolCall, toolRegistry);
    }

    async checkCommandPermissions(command: string): Promise<any> {
        return checkCommandPermissions(command, this.config);
    }

    async getFunctionDeclarations(): Promise<any[]> {
        const toolRegistry = await this.config.getToolRegistry();
        return toolRegistry.getFunctionDeclarations();
    }

    async getToolRegistry(): Promise<any> {
        return this.config.getToolRegistry();
    }

    getShellExecutionService(): any {
        return ShellExecutionService;
    }
}

class GoogleWorkspaceService implements WorkspaceService {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    async shouldIgnoreFile(filePath: string): Promise<boolean> {
        const fileService = this.config.getFileService();
        return fileService.shouldIgnoreFile(filePath);
    }

    getProjectTempDir(): string {
        return this.config.getProjectTempDir();
    }

    async isGitRepository(): Promise<boolean> {
        return isGitRepository(this.config.getProjectRoot());
    }

    getFileDiscoveryService(): any {
        return this.config.getFileService();
    }

    getProjectRoot(): string {
        return this.config.getProjectRoot();
    }
}

class GoogleAuthService implements AuthService {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    async refreshAuth(authType: any): Promise<void> {
        await this.config.refreshAuth(authType);
    }

    async clearCachedCredentialFile(): Promise<void> {
        await clearCachedCredentialFile();
    }

    getAuthType(): any {
        return this.config.getContentGeneratorConfig().authType;
    }

    isBrowserLaunchSuppressed(): boolean {
        return this.config.isBrowserLaunchSuppressed();
    }

    validateAuthMethod(authMethod: string): string | null {
        // Import the validation logic from auth.ts
        if (
            authMethod === AuthType.LOGIN_WITH_GOOGLE ||
            authMethod === AuthType.CLOUD_SHELL
        ) {
            return null;
        }

        if (authMethod === AuthType.USE_GEMINI) {
            if (!process.env.GEMINI_API_KEY) {
                return 'GEMINI_API_KEY environment variable not found. Add that to your environment and try again (no reload needed if using .env)!';
            }
            return null;
        }

        if (authMethod === AuthType.USE_VERTEX_AI) {
            const hasVertexProjectLocationConfig =
                !!process.env.GOOGLE_CLOUD_PROJECT && !!process.env.GOOGLE_CLOUD_LOCATION;
            const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY;
            if (!hasVertexProjectLocationConfig && !hasGoogleApiKey) {
                return (
                    'When using Vertex AI, you must specify either:\n' +
                    '• GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION environment variables.\n' +
                    '• GOOGLE_API_KEY environment variable (if using express mode).\n' +
                    'Update your environment and try again (no reload needed if using .env)!'
                );
            }
            return null;
        }

        return 'Invalid auth method selected.';
    }

    getCodeAssistServer(): any {
        const server = this.config.getGeminiClient().getContentGenerator();
        if (!(server instanceof CodeAssistServer)) {
            throw new Error('OAuth not being used');
        } else if (!server.projectId) {
            throw new Error('OAuth not being used');
        }
        return server;
    }

    mcpServerRequiresOAuth(serverName: string): boolean {
        return mcpServerRequiresOAuth(serverName);
    }

    getMCPOAuthProvider(serverName: string): any {
        return MCPOAuthProvider; // This might need adjustment based on actual implementation
    }
}

class GoogleMemoryService implements MemoryService {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    async loadHierarchicalMemory(): Promise<void> {
        await loadServerHierarchicalMemory(
            this.config.getProjectRoot(),
            this.config.getDebugMode(),
            this.config.getFileService(),
            this.config.getFileFilteringOptions()
        );
    }

    getUserMemory(): string {
        return this.config.getUserMemory();
    }

    setUserMemory(content: string): void {
        this.config.setUserMemory(content);
    }

    getGeminiMdFileCount(): number {
        return this.config.getGeminiMdFileCount();
    }

    setGeminiMdFileCount(count: number): void {
        this.config.setGeminiMdFileCount(count);
    }
}

class GoogleSettingsService implements SettingsService {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    getApprovalMode(): 'yolo' | 'auto_edit' | 'default' {
        const mode = this.config.getApprovalMode();
        // Map the core ApprovalMode enum to our interface values
        switch (mode) {
            case 'yolo': return 'yolo';
            case 'auto_edit': return 'auto_edit';
            default: return 'default';
        }
    }

    setApprovalMode(mode: 'yolo' | 'auto_edit' | 'default'): void {
        // Map interface values back to core ApprovalMode enum
        this.config.setApprovalMode(mode as any);
    }

    getProjectRoot(): string {
        return this.config.getProjectRoot();
    }

    getSessionId(): string {
        return this.config.getSessionId();
    }

    getModel(): string {
        return this.config.getModel();  
    }

    getMaxSessionTurns(): number {
        return this.config.getMaxSessionTurns();
    }

    createLogger(): any {
        return new Logger(this.config.getSessionId());
    }

    getProjectTempDir(): string {
        return this.config.getProjectTempDir();
    }

    getCheckpointingEnabled(): boolean {
        return this.config.getCheckpointingEnabled();
    }

    setQuotaErrorOccurred(occurred: boolean): void {
        this.config.setQuotaErrorOccurred(occurred);
    }

    getContentGeneratorConfig(): any {
        return this.config.getContentGeneratorConfig();
    }

    getSandboxConfig(): any {
        return this.config.getSandboxConfig();
    }

    loadEnvironment(): void {
        // Import and call the loadEnvironment function from settings
        // For now, we'll delegate this to a utility function if needed
        // This might require importing from the config/settings module
    }
}

export class GoogleAdapter implements CoreAdapter {
    private config: Config;

    chat: ChatService;
    tools: ToolingService;
    workspace: WorkspaceService;
    auth: AuthService;
    memory: MemoryService;
    settings: SettingsService;

    constructor(config: Config) {
        this.config = config;
        this.chat = new GoogleChatService(config);
        this.tools = new GoogleToolingService(config);
        this.workspace = new GoogleWorkspaceService(config);
        this.auth = new GoogleAuthService(config);
        this.memory = new GoogleMemoryService(config);
        this.settings = new GoogleSettingsService(config);
    }

    async initialize(): Promise<void> {
        await this.config.initialize();
    }

    isTelemetryInitialized(): boolean {
        return isTelemetrySdkInitialized();
    }

    async shutdownTelemetry(): Promise<void> {
        await shutdownTelemetry();
    }
}