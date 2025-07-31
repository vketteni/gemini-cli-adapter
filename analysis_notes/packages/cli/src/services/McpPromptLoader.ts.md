**File:** `packages/cli/src/services/McpPromptLoader.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `getErrorMessage`, `getMCPServerPrompts`

**Usage Patterns:**
1.  **Constructor (`McpPromptLoader` class):**
    *   Takes a `Config` object (or `null`) as a dependency.

2.  **Loading Commands (`loadCommands` method):**
    *   `this.config.getMcpServers()`: Retrieves the configured MCP servers from the `Config` object.
    *   `getMCPServerPrompts(this.config, serverName)`: Fetches prompts exposed by a specific MCP server.
    *   `getErrorMessage(error)`: Used for error handling when invoking prompts.
