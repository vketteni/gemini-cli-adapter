
/**
 * @fileoverview Defines the core adapter interface for the Gemini CLI.
 *
 * This file specifies the contract that all backend core modules must implement
 * to be compatible with the Gemini CLI frontend. It is designed to be
 * domain-driven, separating concerns into logical services.
 */

// Type imports needed by the interfaces

/**
 * Setting scope enumeration for hierarchical settings management
 */
export enum SettingScope {
  User = 'User',
  Workspace = 'Workspace',
  System = 'System',
}

/**
 * Basic settings interface - defines common UI and behavior settings
 */
export interface Settings {
  theme?: string;
  selectedAuthType?: any;
  hideTips?: boolean;
  hideBanner?: boolean;
  vimMode?: boolean;
  hideWindowTitle?: boolean;
  // Add other commonly used settings as needed
}

/**
 * Loaded settings interface for hierarchical settings management
 */
export interface LoadedSettings {
  readonly merged: Settings;
  setValue<K extends keyof Settings>(
    scope: SettingScope,
    key: K,
    value: Settings[K],
  ): void;
}
export interface GeminiCLIExtension {
  name: string;
  version: string;
  isActive: boolean;
  path: string;
  description?: string;
}

// Note: We will need to define or import types like `Tool`, `ToolCall`,
// `AuthType`, etc. as we build out the implementation. For now, we use
// placeholders like `any` or define basic structures.

// --- Service Interfaces ---

/**
 * Handles all interactions related to chat sessions and communication with the
 * underlying AI model.
 */
export interface ChatService {
  /**
   * Sends a prompt to the model and returns a stream of events.
   */
  sendMessageStream(request: any, prompt_id: string): AsyncIterable<any>;

  /**
   * Retrieves the current chat history.
   */
  getHistory(): Promise<any[]>;

  /**
   * Overwrites the current chat history.
   */
  setHistory(history: any[]): Promise<void>;

  /**
   * Resets the current chat session.
   */
  resetChat(): Promise<void>;

  /**
   * Attempts to compress the chat history.
   */
  tryCompressChat(promptId?: string, forceCompress?: boolean): Promise<any>;

  /**
   * Sets the available tools for the chat session.
   */
  setTools(): Promise<void>;

  /**
   * Adds history to the chat session.
   */
  addHistory(content: any): Promise<void>;
}

/**
 * Manages the registration, discovery, and execution of tools.
 */
export interface ToolingService {
  /**
   * Retrieves a specific tool by name.
   */
  getTool(name: string): Promise<any | undefined>;

  /**
   * Retrieves all available tools.
   */
  getAllTools(): Promise<any[]>;

  /**
   * Executes a tool call.
   */
  executeToolCall(toolCall: any): Promise<any>;

  /**
   * Checks the permissions for a given shell command.
   */
  checkCommandPermissions(command: string, sessionAllowlist?: Set<string>): Promise<any>;

  /**
   * Retrieves the function declarations for all available tools.
   */
  getFunctionDeclarations(): Promise<any[]>;

  /**
   * Gets the tool registry instance for advanced tool management.
   */
  getToolRegistry(): Promise<any>;

  /**
   * Gets the shell execution service for running shell commands.
   */
  getShellExecutionService(): any;

  /**
   * Gets the prompt registry instance.
   */
  getPromptRegistry(): Promise<any>;

  /**
   * Gets the IDE client instance.
   */
  getIdeClient(): any;

  /**
   * Creates a CoreToolScheduler instance.
   */
  createCoreToolScheduler(options: any): any;
}

/**
 * Handles interactions with the user's workspace, including file system
 * operations and source control.
 */
export interface WorkspaceService {
  /**
   * Checks if a file should be ignored based on .gitignore or .geminiignore.
   */
  shouldIgnoreFile(filePath: string): Promise<boolean>;

  /**
   * Gets the project's temporary directory.
   */
  getProjectTempDir(): string;

  /**
   * Checks if the current directory is a Git repository.
   */
  isGitRepository(): Promise<boolean>;

  /**
   * Gets the file discovery service.
   */
  getFileDiscoveryService(): any;

  /**
   * Gets the project root directory.
   */
  getProjectRoot(): string;
}

/**
 * Manages authentication and authorization.
 */
export interface AuthService {
  /**
   * Refreshes the authentication credentials for a given auth type.
   */
  refreshAuth(authType: any): Promise<void>;

  /**
   * Clears any cached credentials.
   */
  clearCachedCredentialFile(): Promise<void>;

  /**
   * Gets the current authentication type.
   */
  getAuthType(): any;

  /**
   * Checks if browser launch is suppressed for authentication.
   */
  isBrowserLaunchSuppressed(): boolean;

  /**
   * Validates an authentication method.
   */
  validateAuthMethod(authMethod: string): string | null;

  /**
   * Gets the code assist server instance.
   */
  getCodeAssistServer(): any;

  /**
   * Checks if MCP server requires OAuth.
   */
  mcpServerRequiresOAuth(serverName: string): boolean;

  /**
   * Gets the MCP OAuth provider for a server.
   */
  getMCPOAuthProvider(serverName: string): any;
}

/**
 * Manages the loading and accessing of hierarchical memory.
 */
export interface MemoryService {
  /**
   * Loads the hierarchical memory from the workspace.
   */
  loadHierarchicalMemory(): Promise<{memoryContent: string; fileCount: number}>;

  /**
   * Gets the current user-defined memory content.
   */
  getUserMemory(): string;

  /**
   * Sets the user-defined memory content.
   */
  setUserMemory(content: string): void;

  /**
   * Gets the count of GEMINI.md files loaded.
   */
  getGeminiMdFileCount(): number;

  /**
   * Sets the count of GEMINI.md files loaded.
   */
  setGeminiMdFileCount(count: number): void;
}

/**
 * Provides access to various configuration settings.
 */
export interface SettingsService {
  /**
   * Gets the current approval mode for tool calls.
   */
  getApprovalMode(): 'yolo' | 'auto_edit' | 'default';

  /**
   * Sets the approval mode for tool calls.
   */
  setApprovalMode(mode: 'yolo' | 'auto_edit' | 'default'): void;

  /**
   * Gets the root directory of the project.
   */
  getProjectRoot(): string;

  /**
   * Gets the current session ID.
   */
  getSessionId(): string;

  /**
   * Gets the configured AI model.
   */
  getModel(): string;

  /**
   * Gets the default AI model.
   */
  getDefaultModel(): string;

  /**
   * Gets the default AI embedding model.
   */
  getDefaultEmbeddingModel(): string;

  /**
   * Gets the maximum number of turns for a session.
   */
  getMaxSessionTurns(): number;

  /**
   * Creates a logger instance for telemetry.
   */
  createLogger(): any;

  /**
   * Gets the project temporary directory.
   */
  getProjectTempDir(): string;

  /**
   * Gets whether checkpointing is enabled.
   */
  getCheckpointingEnabled(): boolean;

  /**
   * Sets quota error occurred flag.
   */
  setQuotaErrorOccurred(occurred: boolean): void;

  /**
   * Gets content generator configuration.
   */
  getContentGeneratorConfig(): any;

  /**
   * Gets the sandbox configuration.
   */
  getSandboxConfig(): any;

  /**
   * Loads environment variables and settings.
   */
  loadEnvironment(): void;

  /**
   * Gets the configured MCP servers.
   */
  getMcpServers(): any;

  /**
   * Gets the current authentication type.
   */
  getAuthType(): any;

  /**
   * Gets the list of blocked MCP servers.
   */
  getBlockedMcpServers(): any[];

  /**
   * Gets the list of active extensions.
   */
  getExtensions(): GeminiCLIExtension[];

  /**
   * Gets whether IDE mode is enabled.
   */
  getIdeMode(): boolean;

  /**
   * Gets the IDE client instance.
   */
  getIdeClient(): any;

  /**
   * Gets whether recursive file search is enabled.
   */
  getEnableRecursiveFileSearch(): boolean;

  /**
   * Gets the file filtering options.
   */
  getFileFilteringOptions(): any; // Changed to any for now, will define FilterFilesOptions later

  /**
   * Gets whether debug mode is enabled.
   */
  getDebugMode(): boolean;

  /**
   * Gets whether to list extensions.
   */
  getListExtensions?(): boolean;

  /**
   * Gets whether experimental ACP is enabled.
   */
  getExperimentalAcp?(): boolean;

  /**
   * Gets the input question from CLI arguments.
   */
  getQuestion?(): string;

  // --- UI Settings Methods ---

  /**
   * Gets whether the tips component should be hidden.
   */
  getHideTips(): boolean | undefined;

  /**
   * Sets whether the tips component should be hidden.
   */
  setHideTips(hide: boolean): void;

  /**
   * Gets whether the banner component should be hidden.
   */
  getHideBanner(): boolean | undefined;

  /**
   * Sets whether the banner component should be hidden.
   */
  setHideBanner(hide: boolean): void;

  /**
   * Gets whether vim mode is enabled.
   */
  getVimMode(): boolean | undefined;

  /**
   * Sets whether vim mode is enabled.
   */
  setVimMode(enabled: boolean): void;

  /**
   * Gets whether the window title should be hidden.
   */
  getHideWindowTitle(): boolean | undefined;

  /**
   * Sets whether the window title should be hidden.
   */
  setHideWindowTitle(hide: boolean): void;
}

// --- Core Adapter Interface ---

/**
 * The primary interface that all core modules must implement. It serves as the
 * single point of interaction for the CLI frontend.
 */
export interface CoreAdapter {
  /**
   * Checks if the telemetry SDK is initialized.
   */
  isTelemetryInitialized(): boolean;

  /**
   * Shuts down the telemetry SDK.
   */
  shutdownTelemetry(): Promise<void>;

  chat: ChatService;
  tools: ToolingService;
  workspace: WorkspaceService;
  auth: AuthService;
  memory: MemoryService;
  settings: SettingsService;
}
