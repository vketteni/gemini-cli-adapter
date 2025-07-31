
/**
 * @fileoverview Defines the core adapter interface for the Gemini CLI.
 *
 * This file specifies the contract that all backend core modules must implement
 * to be compatible with the Gemini CLI frontend. It is designed to be
 * domain-driven, separating concerns into logical services.
 */

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
  tryCompressChat(): Promise<boolean>;
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
  checkCommandPermissions(command: string): Promise<any>;

  /**
   * Retrieves the function declarations for all available tools.
   */
  getFunctionDeclarations(): Promise<any[]>;
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
}

/**
 * Manages the loading and accessing of hierarchical memory.
 */
export interface MemoryService {
  /**
   * Loads the hierarchical memory from the workspace.
   */
  loadHierarchicalMemory(): Promise<void>;

  /**
   * Gets the current user-defined memory content.
   */
  getUserMemory(): string;

  /**
   * Sets the user-defined memory content.
   */
  setUserMemory(content: string): void;
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
   * Gets the maximum number of turns for a session.
   */
  getMaxSessionTurns(): number;
}


// --- Core Adapter Interface ---

/**
 * The primary interface that all core modules must implement. It serves as the
 * single point of interaction for the CLI frontend.
 */
export interface CoreAdapter {
  /**
   * Initializes the adapter.
   */
  initialize(): Promise<void>;

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
