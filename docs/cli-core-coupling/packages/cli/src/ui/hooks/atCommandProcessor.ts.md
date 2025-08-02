**File:** `packages/cli/src/ui/hooks/atCommandProcessor.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `getErrorMessage`, `isNodeError`, `unescapePath`

**Usage Patterns:**
1.  **File Discovery and Filtering:**
    *   `config.getFileService()`: Retrieves the file discovery service.
    *   `config.getFileFilteringOptions()`: Retrieves file filtering options (including `respectGitIgnore` and `respectGeminiIgnore`).
    *   `fileDiscovery.shouldIgnoreFile(...)`: Checks if a file should be ignored based on `.gitignore` or `.geminiignore` rules.
    *   `config.getEnableRecursiveFileSearch()`: Checks if recursive file search is enabled.

2.  **Tool Interaction:**
    *   `config.getToolRegistry()`: Retrieves the tool registry.
    *   `toolRegistry.getTool('read_many_files')`: Accesses the `read_many_files` tool.
    *   `toolRegistry.getTool('glob')`: Accesses the `glob` tool.
    *   `readManyFilesTool.execute(...)`: Executes the `read_many_files` tool to read file contents.
    *   `globTool.execute(...)`: Executes the `glob` tool for recursive file searches.

3.  **Path Handling:**
    *   `unescapePath(...)`: Used to unescape file paths that might contain escaped spaces.

4.  **Error Handling:**
    *   `isNodeError(...)`: Checks if an error is a Node.js system error.
    *   `getErrorMessage(...)`: Retrieves a user-friendly error message.
