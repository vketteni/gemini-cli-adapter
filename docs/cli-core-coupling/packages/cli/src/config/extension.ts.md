**File:** `packages/cli/src/config/extension.ts`

**Imports from `@google/gemini-cli-core`:**
- `MCPServerConfig`, `GeminiCLIExtension`

**Usage Patterns:**
1.  **Extension Configuration (`ExtensionConfig` interface):**
    *   `MCPServerConfig`: Used within the `mcpServers` property of `ExtensionConfig` to define MCP server configurations provided by an extension.

2.  **Active Extension Annotation (`annotateActiveExtensions` function):**
    *   `GeminiCLIExtension`: Used as the return type for `annotateActiveExtensions`, which adds an `isActive` property to the extension configuration.
