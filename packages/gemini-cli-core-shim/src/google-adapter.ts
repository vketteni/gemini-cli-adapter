import { CoreAdapter, ChatService, ToolingService, WorkspaceService, AuthService, MemoryService, SettingsService } from "@open-cli/interface";
import { CoreToolScheduler } from "@google/gemini-cli-core";
import { GoogleAuth } from 'google-auth-library';
import { 
  Config,
  GeminiClient, 
  executeToolCall,
  ToolCallRequestInfo,
  ToolRegistry,
  getProjectTempDir,
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
  MCPOAuthProvider,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_EMBEDDING_MODEL
} from "@google/gemini-cli-core";
import { isGitRepository } from "@google/gemini-cli-core/dist/src/utils/gitUtils.js";

class GoogleChatService implements ChatService {
    private config: Config;
    private geminiClient: GeminiClient;

    constructor(config: Config) {
        this.config = config;
        this.geminiClient = config.getGeminiClient();
        
        // Add defensive programming - check if GeminiClient was properly initialized
        if (!this.geminiClient) {
            throw new Error('GoogleChatService: GeminiClient is undefined. Config may not be properly initialized. Make sure to call config.initialize() before creating the adapter.');
        }
    }

    private ensureChat() {
        if (!this.geminiClient) {
            throw new Error('GoogleChatService: GeminiClient is undefined');
        }
        const chat = this.geminiClient.getChat();
        if (!chat) {
            throw new Error('GoogleChatService: Failed to get chat instance from GeminiClient');
        }
        return chat;
    }

    async *sendMessageStream(request: any, prompt_id: string): AsyncIterable<any> {
        const chat = this.ensureChat();
        const stream = await chat.sendMessageStream(request, prompt_id);
        for await (const chunk of stream) {
            yield chunk;
        }
    }

    async getHistory(): Promise<any[]> {
        const chat = this.ensureChat();
        return chat.getHistory();
    }

    async setHistory(history: any[]): Promise<void> {
        const chat = this.ensureChat();
        chat.setHistory(history);
    }

    async resetChat(): Promise<void> {
        if (!this.geminiClient) {
            throw new Error('GoogleChatService: GeminiClient is undefined');
        }
        await this.geminiClient.resetChat();
    }

    async tryCompressChat(promptId?: string, forceCompress?: boolean): Promise<any> {
        if (!this.geminiClient) {
            throw new Error('GoogleChatService: GeminiClient is undefined');
        }
        return this.geminiClient.tryCompressChat(promptId || '', forceCompress);
    }

    async setTools(): Promise<void> {
        if (!this.geminiClient) {
            throw new Error('GoogleChatService: GeminiClient is undefined');
        }
        await this.geminiClient.setTools();
    }

    async addHistory(history: any[]): Promise<void> {
        const chat = this.ensureChat();
        // Fallback to setHistory with current + new history
        const currentHistory = await this.getHistory();
        chat.setHistory([...currentHistory, ...history]);
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

    async checkCommandPermissions(command: string, sessionAllowlist?: Set<string>): Promise<any> {
        return checkCommandPermissions(command, this.config, sessionAllowlist);
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

    async getPromptRegistry(): Promise<any> {
        return this.config.getPromptRegistry();
    }

    getIdeClient(): any {
        return this.config.getIdeClient();
    }

    createCoreToolScheduler(options: any): any {
        return new CoreToolScheduler({
            ...options,
            config: this.config
        });
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
        const config = this.config.getContentGeneratorConfig();
        return config?.authType;
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
        return mcpServerRequiresOAuth.get(serverName) || false;
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
            []
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
        switch (mode as string) {
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

    getDefaultModel(): string {
        return DEFAULT_GEMINI_MODEL;
    }

    getDefaultEmbeddingModel(): string {
        return DEFAULT_GEMINI_EMBEDDING_MODEL;
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
        // Stubbing out sandbox functionality for now.
        return null;
    }

    loadEnvironment(): void {
        // Import and call the loadEnvironment function from settings
        // For now, we'll delegate this to a utility function if needed
        // This might require importing from the config/settings module
    }

    getMcpServers(): any {
        return this.config.getMcpServers();
    }

    getAuthType(): any {
        const config = this.config.getContentGeneratorConfig();
        return config?.authType;
    }

    getBlockedMcpServers(): any[] {
        return this.config.getBlockedMcpServers() || [];
    }

    getExtensions(): any[] {
        return this.config.getExtensions() || [];
    }

    getIdeMode(): boolean {
        return this.config.getIdeMode();
    }

    getIdeClient(): any {
        return this.config.getIdeClient();
    }

    getEnableRecursiveFileSearch(): boolean {
        return this.config.getEnableRecursiveFileSearch?.() ?? true;
    }

    getFileFilteringOptions(): any {
        return this.config.getFileFilteringOptions?.() ?? {};
    }

    getDebugMode(): boolean {
        return this.config.getDebugMode();
    }

    getListExtensions?(): boolean {
        return this.config.getListExtensions?.() ?? false;
    }

    getExperimentalAcp?(): boolean {
        return this.config.getExperimentalAcp?.() ?? false;
    }

    getQuestion?(): string {
        return this.config.getQuestion?.() ?? '';
    }
}

export class GoogleAdapter implements CoreAdapter {
  chat!: ChatService;
  tools!: ToolingService;
  workspace!: WorkspaceService;
  auth!: AuthService;
  memory!: MemoryService;
  settings!: SettingsService;

  private constructor(private config: Config) {
    // Services will be initialized in static create() method
  }

  /**
   * Asynchronously creates a fully-initialized GoogleAdapter.
   */
  static async create(config: Config): Promise<GoogleAdapter> {
    await config.initialize(); // Ensure all config-dependent resources are ready

    // Check if GeminiClient is available after initialization
    let geminiClient = config.getGeminiClient();
    if (!geminiClient) {
      // GeminiClient is not initialized yet. This happens because the GeminiClient
      // is only created during refreshAuth(). We need to initialize it with a default auth type.
      
      // Get the auth type from content generator config or use a default
      const contentGeneratorConfig = config.getContentGeneratorConfig();
      let authType = contentGeneratorConfig?.authType;
      
      if (!authType) {
        // Determine the appropriate auth type based on environment
        if (process.env.CLOUD_SHELL === 'true') {
          authType = AuthType.CLOUD_SHELL;
        } else if (process.env.GEMINI_API_KEY) {
          authType = AuthType.USE_GEMINI;
        } else if (process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION) {
          authType = AuthType.USE_VERTEX_AI;
        } else {
          authType = AuthType.LOGIN_WITH_GOOGLE;
        }
      }

      // Initialize the GeminiClient with the determined auth type
      await config.refreshAuth(authType);
      
      // Verify the GeminiClient is now available
      geminiClient = config.getGeminiClient();
      if (!geminiClient) {
        throw new Error(`GoogleAdapter.create(): Failed to initialize GeminiClient even after refreshAuth with authType: ${authType}`);
      }
    }

    const adapter = new GoogleAdapter(config);

    adapter.chat = new GoogleChatService(config);
    adapter.tools = new GoogleToolingService(config);
    adapter.workspace = new GoogleWorkspaceService(config);
    adapter.auth = new GoogleAuthService(config);
    adapter.memory = new GoogleMemoryService(config);
    adapter.settings = new GoogleSettingsService(config);

    return adapter;
  }

  isTelemetryInitialized(): boolean {
    return isTelemetrySdkInitialized();
  }

  async shutdownTelemetry(): Promise<void> {
    await shutdownTelemetry();
  }
}

