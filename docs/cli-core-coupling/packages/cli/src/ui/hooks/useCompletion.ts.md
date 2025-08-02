**File:** `packages/cli/src/ui/hooks/useCompletion.ts`

**Imports from `@google/gemini-cli-core`:**
- `isNodeError`, `escapePath`, `unescapePath`, `getErrorMessage`, `Config`, `FileDiscoveryService`, `DEFAULT_FILE_FILTERING_OPTIONS`

**Usage Patterns:**
1.  **File System Interaction:**
    *   `fs.readdir`: Used to read directory contents for file path suggestions.
    *   `path.resolve`, `path.join`, `path.relative`: Used for path manipulation.
    *   `glob`: Used for pattern matching in file searches.

2.  **Configuration Access:**
    *   `config?.getFileService()`: Retrieves the `FileDiscoveryService` for file filtering.
    *   `config?.getEnableRecursiveFileSearch()`: Checks if recursive file search is enabled.
    *   `config?.getFileFilteringOptions()`: Retrieves file filtering options (e.g., `respectGitIgnore`, `respectGeminiIgnore`).
    *   `DEFAULT_FILE_FILTERING_OPTIONS`: Provides default file filtering options.

3.  **Path Utilities:**
    *   `escapePath`: Used to escape file paths for display or internal use.
    *   `unescapePath`: Used to unescape file paths from user input.

4.  **Error Handling:**
    *   `isNodeError`: Checks if an error is a Node.js system error.
    *   `getErrorMessage`: Retrieves a user-friendly error message.
