import { CLIProvider, ChatService, ToolingService, WorkspaceService, AuthService, MemoryService, SettingsService, LoadedSettings, SettingScope } from "@open-cli/interface";
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
    private geminiClient?: GeminiClient;

    constructor(config: Config) {
        this.config = config;
        // Note: We no longer eagerly get the GeminiClient here.
        // It will be lazily initialized when first needed.
    }

    private async ensureAuthenticated(): Promise<void> {
        if (!this.geminiClient) {
            // Check if GeminiClient is already available
            this.geminiClient = this.config.getGeminiClient();
            
            if (!this.geminiClient) {
                // GeminiClient is not initialized yet. Initialize authentication lazily.
                const contentGeneratorConfig = this.config.getContentGeneratorConfig();
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
                await this.config.refreshAuth(authType);
                
                // Get the initialized client
                this.geminiClient = this.config.getGeminiClient();
                if (!this.geminiClient) {
                    throw new Error(`GoogleChatService: Failed to initialize GeminiClient with authType: ${authType}`);
                }
            }
        }
    }

    private async ensureChat() {
        await this.ensureAuthenticated();
        if (!this.geminiClient) {
            throw new Error('GoogleChatService: GeminiClient is undefined after authentication');
        }
        const chat = this.geminiClient.getChat();
        if (!chat) {
            throw new Error('GoogleChatService: Failed to get chat instance from GeminiClient');
        }
        return chat;
    }

    async *sendMessageStream(request: any, prompt_id: string): AsyncIterable<any> {
        await this.ensureAuthenticated();
        
        // Determine if this is interactive or non-interactive mode
        if (request && typeof request === 'object' && ('message' in request || 'config' in request)) {
            // Non-interactive mode: use GeminiChat.sendMessageStream with structured request
            const chat = await this.ensureChat();
            const stream = await chat.sendMessageStream(request, prompt_id);
            for await (const chunk of stream) {
                yield chunk;
            }
        } else {
            // Interactive mode: use GeminiClient.sendMessageStream with PartListUnion
            // This returns ServerGeminiStreamEvent which is what the UI expects
            const abortController = new AbortController();
            const stream = this.geminiClient!.sendMessageStream(
                request, 
                abortController.signal, 
                prompt_id
            );
            for await (const chunk of stream) {
                yield chunk;
            }
        }
    }

    async getHistory(): Promise<any[]> {
        const chat = await this.ensureChat();
        return chat.getHistory();
    }

    async setHistory(history: any[]): Promise<void> {
        const chat = await this.ensureChat();
        chat.setHistory(history);
    }

    async resetChat(): Promise<void> {
        await this.ensureAuthenticated();
        await this.geminiClient!.resetChat();
    }

    async tryCompressChat(promptId?: string, forceCompress?: boolean): Promise<any> {
        await this.ensureAuthenticated();
        return this.geminiClient!.tryCompressChat(promptId || '', forceCompress);
    }

    async setTools(): Promise<void> {
        await this.ensureAuthenticated();
        await this.geminiClient!.setTools();
    }

    async addHistory(content: any): Promise<void> {
        await this.ensureAuthenticated();
        // Use GeminiClient.addHistory which takes a single Content object
        await this.geminiClient!.addHistory(content);
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

    getShellExecutionService(): typeof ShellExecutionService {
        // Return the class itself since all methods are static
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

    private async ensureAuthenticated(): Promise<void> {
        let geminiClient = this.config.getGeminiClient();
        
        if (!geminiClient) {
            // GeminiClient is not initialized yet. Initialize authentication lazily.
            const contentGeneratorConfig = this.config.getContentGeneratorConfig();
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
            await this.config.refreshAuth(authType);
            
            // Verify the GeminiClient is now available
            geminiClient = this.config.getGeminiClient();
            if (!geminiClient) {
                throw new Error(`GoogleAuthService: Failed to initialize GeminiClient with authType: ${authType}`);
            }
        }
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

    async getCodeAssistServer(): Promise<any> {
        await this.ensureAuthenticated();
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

    async loadHierarchicalMemory(): Promise<{memoryContent: string; fileCount: number}> {
        return await loadServerHierarchicalMemory(
            this.config.getProjectRoot(),
            this.config.getDebugMode(),
            this.config.getFileService(),
            this.config.getExtensionContextFilePaths(), // Use actual config value instead of []
            this.config.getFileFilteringOptions(), // Add missing parameter
            undefined // Let maxDirs use default
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
    private loadedSettings: LoadedSettings;

    constructor(config: Config, loadedSettings: LoadedSettings) {
        this.config = config;
        this.loadedSettings = loadedSettings;
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
        // No-op: loadEnvironment doesn't exist in the Gemini core module
        // Environment loading is handled during Config initialization
        return;
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

    // --- UI Settings Methods ---

    getHideTips(): boolean | undefined {
        return this.loadedSettings.merged.hideTips;
    }

    setHideTips(hide: boolean): void {
        this.loadedSettings.setValue(SettingScope.User, 'hideTips', hide);
    }

    getHideBanner(): boolean | undefined {
        return this.loadedSettings.merged.hideBanner;
    }

    setHideBanner(hide: boolean): void {
        this.loadedSettings.setValue(SettingScope.User, 'hideBanner', hide);
    }

    getVimMode(): boolean | undefined {
        return this.loadedSettings.merged.vimMode;
    }

    setVimMode(enabled: boolean): void {
        this.loadedSettings.setValue(SettingScope.User, 'vimMode', enabled);
    }

    getHideWindowTitle(): boolean | undefined {
        return this.loadedSettings.merged.hideWindowTitle;
    }

    setHideWindowTitle(hide: boolean): void {
        this.loadedSettings.setValue(SettingScope.User, 'hideWindowTitle', hide);
    }
}

export class GoogleAdapter implements CLIProvider {
  chat!: ChatService;
  tools!: ToolingService;
  workspace!: WorkspaceService;
  auth!: AuthService;
  memory!: MemoryService;
  settings!: SettingsService;

  private constructor(private config: Config, private loadedSettings: LoadedSettings) {
    // Services will be initialized in static create() method
  }

  /**
   * Asynchronously creates a fully-initialized GoogleAdapter.
   */
  static async create(config: Config, loadedSettings: LoadedSettings): Promise<GoogleAdapter> {
    await config.initialize(); // Ensure all config-dependent resources are ready
    
    // Note: We no longer eagerly initialize authentication here.
    // Authentication will be lazily initialized when first needed by services.

    const adapter = new GoogleAdapter(config, loadedSettings);

    adapter.chat = new GoogleChatService(config);
    adapter.tools = new GoogleToolingService(config);
    adapter.workspace = new GoogleWorkspaceService(config);
    adapter.auth = new GoogleAuthService(config);
    adapter.memory = new GoogleMemoryService(config);
    adapter.settings = new GoogleSettingsService(config, loadedSettings);

    // Configure default UI settings for Google implementation
    adapter.settings.setHideTips(true);

    return adapter;
  }

  isTelemetryInitialized(): boolean {
    return isTelemetrySdkInitialized();
  }

  async shutdownTelemetry(): Promise<void> {
    await shutdownTelemetry();
  }
}

