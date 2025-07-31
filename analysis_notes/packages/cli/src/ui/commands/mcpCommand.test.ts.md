**File:** `packages/cli/src/ui/commands/mcpCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `MCPServerStatus`, `MCPDiscoveryState`, `getMCPServerStatus`, `getMCPDiscoveryState`, `DiscoveredMCPTool`, `MCPOAuthProvider`, `MCPOAuthTokenStorage`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `getMCPServerStatus`, `getMCPDiscoveryState`: Mocked to control the status of MCP servers and their discovery process.
    *   `DiscoveredMCPTool`: Used to create mock MCP tool instances.
    *   `MCPOAuthProvider`: Mocked to simulate OAuth authentication with MCP servers.
    *   `MCPOAuthTokenStorage`: Mocked to simulate token storage for OAuth.
    *   `mockConfig.getToolRegistry()`: Used to retrieve the mocked tool registry.
    *   `mockConfig.getMcpServers()`: Used to retrieve the mocked MCP server configurations.
    *   `mockConfig.getBlockedMcpServers()`: Used to retrieve mocked blocked MCP servers.
    *   `mockConfig.getPromptRegistry()`: Used to retrieve the mocked prompt registry.

2.  **Testing MCP Server Status and Tool Display:**
    *   Tests verify that the `/mcp` command correctly displays the status of configured MCP servers (connected, connecting, disconnected) and their associated tools.
    *   It checks for proper display of tool descriptions and schemas based on command arguments (`desc`, `nodesc`, `schema`).
    *   It verifies the display of blocked MCP servers.

3.  **Testing Authentication Subcommand (`auth`):**
    *   Tests the authentication flow for OAuth-enabled MCP servers, including listing servers, successful authentication, and error handling.
    *   `MCPOAuthProvider.authenticate`: Called to simulate the authentication process.
    *   `mockToolRegistry.discoverToolsForServer`: Called to simulate tool discovery after authentication.
    *   `mockGeminiClient.setTools`: Called to update the Gemini client with new tools.

4.  **Testing Refresh Subcommand (`refresh`):**
    *   Tests the refresh functionality for MCP servers and tools.
    *   `mockToolRegistry.discoverMcpTools`: Called to simulate the discovery of MCP tools.
