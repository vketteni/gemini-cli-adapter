**File:** `packages/cli/src/ui/commands/memoryCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `getErrorMessage`, `loadServerHierarchicalMemory`, `FileDiscoveryService`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `getErrorMessage`: Mocked to control error message formatting.
    *   `loadServerHierarchicalMemory`: Mocked to simulate loading hierarchical memory.
    *   `FileDiscoveryService`: Mocked to simulate file discovery service behavior.

2.  **Testing `/memory show`:**
    *   `mockContext.services.config.getUserMemory()`: Used to retrieve the mocked user memory content.
    *   `mockContext.services.config.getGeminiMdFileCount()`: Used to retrieve the mocked count of GEMINI.md files.

3.  **Testing `/memory add`:**
    *   Returns a `tool` action with `toolName: 'save_memory'` and `toolArgs: { fact: ... }`. This indicates that `save_memory` is a core tool.

4.  **Testing `/memory refresh`:**
    *   `mockContext.services.config.setUserMemory()`: Used to set the mocked user memory content.
    *   `mockContext.services.config.setGeminiMdFileCount()`: Used to set the mocked count of GEMINI.md files.
    *   `loadServerHierarchicalMemory`: Called to simulate the memory refresh process.
    *   `mockContext.services.config.getWorkingDir()`, `mockContext.services.config.getDebugMode()`, `mockContext.services.config.getFileService()`, `mockContext.services.config.getExtensionContextFilePaths()`, `mockContext.services.config.getFileFilteringOptions()`: These methods are used to pass configuration details to `loadServerHierarchicalMemory`.
