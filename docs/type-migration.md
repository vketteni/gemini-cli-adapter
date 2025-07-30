# Type Migration Reference

This document lists all types imported from `@google/gemini-cli-core` that need to be abstracted into `@gemini-cli-adapter/core-interface`.

## Types to Abstract

### Authentication & Configuration
- `AuthType` - Authentication method enum
- `Config` - Main configuration interface
- `SandboxConfig` - Sandbox configuration
- `UserTierId` - User tier enumeration
- `CodeAssistServer` - Server configuration

### Core Services & Clients
- `GeminiClient` - Main AI client interface
- `GitService` - Git operations service
- `Logger` - Logging interface
- `ToolRegistry` - Tool registration system
- `FileDiscoveryService` - File discovery service

### Tool System
- `Tool` - Tool interface
- `ToolConfirmationOutcome` - Tool confirmation result
- `ToolCallStats` - Tool execution statistics
- `ToolCallConfirmationDetails` - Tool confirmation details
- `ApprovalMode` - Tool approval modes

### UI & Editor
- `EditorType` - Editor type enum
- `IDEConnectionStatus` - IDE connection status
- `ThoughtSummary` - AI thought summary
- `IdeContext` - IDE context information
- `File` - File information interface

### Extensions & MCP
- `MCPServerConfig` - MCP server configuration
- `GeminiCLIExtension` - Extension interface

### Utility Functions
- `getErrorMessage` - Error message extraction
- `getProjectTempDir` - Temp directory utility
- `isGitRepository` - Git repository check
- `isNodeError` - Node error check
- `isEditorAvailable` - Editor availability check
- `shortenPath` - Path shortening utility
- `tildeifyPath` - Path tilde conversion
- `tokenLimit` - Token limit utility
- `unescapePath` - Path unescaping utility
- `sessionId` - Session ID utility
- `uiTelemetryService` - Telemetry service

## Migration Status

- ✅ `Icon` - Completed
- ⏳ All others - Pending

## Implementation Strategy

1. **Phase 1**: Create basic enums and interfaces in core-interface
2. **Phase 2**: Move utility functions to appropriate service interfaces
3. **Phase 3**: Update imports in cli-frontend systematically
4. **Phase 4**: Ensure AdapterBridge provides all needed functionality