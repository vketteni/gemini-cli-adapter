**File:** `packages/cli/src/ui/commands/mcpCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- `DiscoveredMCPPrompt`, `DiscoveredMCPTool`, `getMCPDiscoveryState`, `getMCPServerStatus`, `MCPDiscoveryState`, `MCPServerStatus`, `mcpServerRequiresOAuth`, `getErrorMessage`

**Usage Patterns:**
1.  **MCP Server Status and Discovery:**
    *   `getMCPServerStatus(name)`: Retrieves the connection status of an MCP server.
    *   `getMCPDiscoveryState()`: Retrieves the overall discovery state of MCP servers.
    *   `MCPDiscoveryState`, `MCPServerStatus`: Enums used to interpret and display server statuses.

2.  **Tool and Prompt Discovery:**
    *   `config.getToolRegistry()`: Retrieves the tool registry to get `DiscoveredMCPTool` instances.
    *   `config.getPromptRegistry()`: Retrieves the prompt registry to get `DiscoveredMCPPrompt` instances.

3.  **OAuth Authentication (`authCommand`):**
    *   `mcpServerRequiresOAuth.get(serverName)`: Checks if an MCP server requires OAuth authentication.
    *   `MCPOAuthProvider.authenticate(...)`: (Dynamically imported) Authenticates with an OAuth-enabled MCP server.
    *   `MCPOAuthTokenStorage.getToken(...)`, `MCPOAuthTokenStorage.isTokenExpired(...)`: (Dynamically imported) Used to check and manage OAuth tokens.

4.  **Error Handling:**
    *   `getErrorMessage(error)`: Used to retrieve user-friendly error messages.
