
# High-Level Hierarchical Overview of CLI/@core Coupling

This document provides a hierarchical overview of the coupling between the Gemini CLI frontend and the `@google/gemini-cli-core` module, based on a detailed analysis of the codebase.

### 1. Core Configuration (`Config` object)

This is the most central and pervasive point of coupling. The `Config` object acts as a service locator and a central repository for all runtime configurations. Nearly every part of the CLI depends on it.

*   **Direct Dependency:** Most modules, from high-level command processors (`slashCommandProcessor`) to low-level utilities (`cleanup`), receive the `Config` object.
*   **Service Location:** The `Config` object provides access to other core services:
    *   `getGeminiClient()`: The client for interacting with the Gemini API.
    *   `getToolRegistry()`: The registry for all available tools.
    *   `getFileService()`: The service for file system operations.
    *   `getIdeClient()`: The client for IDE integration.
*   **Settings Management:** It holds all configuration settings, including:
    *   Authentication (`authType`, `refreshAuth`)
    *   Models (`getModel`, `DEFAULT_GEMINI_MODEL`)
    *   File filtering (`getFileFilteringOptions`)
    *   Session management (`sessionId`, `maxSessionTurns`)
    *   Features flags (`getCheckpointingEnabled`, `getIdeMode`)
    *   Sandbox settings (`getSandboxConfig`)

### 2. Gemini Client & Chat (`GeminiClient`, `GeminiChat`)

This is the primary interface for interacting with the Gemini model.

*   **Chat Operations:**
    *   `sendMessageStream()`: The core function for sending prompts and receiving responses.
    *   `getChat()`, `startChat()`, `resetChat()`: Managing chat sessions.
    *   `addHistory()`, `getHistory()`, `setHistory()`: Manipulating chat history.
    *   `tryCompressChat()`: Compressing chat history.
*   **Event Stream:** The client emits a stream of events (`ServerGeminiStreamEvent`) that the UI must handle, including:
    *   `Thought`, `Content`, `ToolCallRequest`, `Error`, `Finished`, etc.

### 3. Tooling & Extensibility

The core module provides a comprehensive framework for defining, discovering, and executing tools.

*   **Tool Registry (`ToolRegistry`):**
    *   `getTool()`, `getAllTools()`: Retrieving registered tools.
    *   `discoverMcpTools()`, `discoverToolsForServer()`: Discovering tools from MCP servers.
*   **Tool Execution:**
    *   `executeToolCall()`: The primary function for executing a tool call.
    *   `CoreToolScheduler`: A sophisticated scheduler for managing the lifecycle of tool calls (validation, confirmation, execution, etc.).
    *   `ShellExecutionService`: A dedicated service for executing shell commands.
    *   `checkCommandPermissions()`: A function for checking if a shell command is allowed to run.
*   **Tool Definition (`Tool`, `ToolCall`, `ToolResult`):** The core module defines the interfaces and types for creating and managing tools.

### 4. Authentication (`AuthType`, `refreshAuth`)

The core module handles all authentication mechanisms.

*   **Auth Types (`AuthType`):** An enum that defines the different authentication methods (`LOGIN_WITH_GOOGLE`, `USE_GEMINI`, `USE_VERTEX_AI`, etc.).
*   **Auth Flow:**
    *   `refreshAuth()`: The function to initiate or refresh authentication.
    *   `clearCachedCredentialFile()`: A utility to clear cached credentials.
    *   `mcpServerRequiresOAuth`, `MCPOAuthProvider`: Handling OAuth for MCP servers.

### 5. File System & Workspace

The core module provides abstractions and utilities for interacting with the file system.

*   **File Discovery (`FileDiscoveryService`):**
    *   `shouldIgnoreFile()`: Checking if a file should be ignored based on `.gitignore` or `.geminiignore`.
*   **Path Utilities:**
    *   `getProjectTempDir()`: Getting the path to the temporary directory.
    *   `getUserCommandsDir()`, `getProjectCommandsDir()`: Getting paths to command directories.
    *   `unescapePath()`, `escapePath()`: Utilities for handling file paths.
*   **Git Integration (`GitService`, `isGitRepository`):**
    *   `restoreProjectFromSnapshot()`: Restoring the project from a Git snapshot.
    *   `isGitRepository()`: Checking if a directory is a Git repository.

### 6. Hierarchical Memory (`loadServerHierarchicalMemory`)

The core module is responsible for loading and managing the hierarchical memory from `GEMINI.md` files.

*   `loadServerHierarchicalMemory()`: The primary function for loading memory.
*   `setUserMemory()`, `getUserMemory()`: Getters and setters for user-defined memory.

### 7. Telemetry & Logging (`Logger`, `logUserPrompt`, `logSlashCommand`)

The core module provides services for telemetry and logging.

*   `Logger`: A class for logging messages.
*   `logUserPrompt()`, `logSlashCommand()`: Functions for logging specific events.
*   `isTelemetrySdkInitialized()`, `shutdownTelemetry()`: Managing the telemetry SDK lifecycle.

### 8. Error Handling (`getErrorMessage`, `isNodeError`)

The core module provides standardized utilities for error handling.

*   `getErrorMessage()`: A function to extract a user-friendly error message.
*   `isNodeError()`: A type guard to check for Node.js system errors.
*   `getErrorStatus()`: A function to extract the status from an error.
