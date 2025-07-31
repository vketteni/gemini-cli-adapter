**File:** `packages/cli/src/ui/commands/toolsCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Accessing Tool Registry:**
    *   `context.services.config?.getToolRegistry()`: Retrieves the tool registry from the command context. This is a crucial dependency for listing available tools.

2.  **Filtering Tools:**
    *   `toolRegistry.getAllTools()`: Gets all registered tools.
    *   The code then filters out "MCP tools" by checking for the absence of a `serverName` property, implying that `serverName` is a property of tools managed by MCP servers (which are likely defined in `@google/gemini-cli-core` or related modules).
