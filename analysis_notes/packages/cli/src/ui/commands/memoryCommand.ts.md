**File:** `packages/cli/src/ui/commands/memoryCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- `getErrorMessage`, `loadServerHierarchicalMemory`

**Usage Patterns:**
1.  **`/memory show` subcommand:**
    *   `context.services.config?.getUserMemory()`: Retrieves the current user memory content.
    *   `context.services.config?.getGeminiMdFileCount()`: Retrieves the count of `GEMINI.md` files contributing to the memory.

2.  **`/memory add` subcommand:**
    *   Returns a `tool` action with `toolName: 'save_memory'`. This indicates that the `save_memory` tool (presumably from the core module) is used to add content to the memory.

3.  **`/memory refresh` subcommand:**
    *   `loadServerHierarchicalMemory(...)`: This function is called to re-load the hierarchical memory from source files. It takes various configuration parameters from `context.services.config` and `context.services.settings.merged`.
    *   `config.setUserMemory(memoryContent)`: Updates the user memory content in the `Config` object after refresh.
    *   `config.setGeminiMdFileCount(fileCount)`: Updates the count of `GEMINI.md` files in the `Config` object after refresh.
    *   `getErrorMessage(error)`: Used for error handling during the refresh process.
