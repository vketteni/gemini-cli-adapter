**File:** `packages/cli/src/ui/hooks/useShowMemoryCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`

**Usage Patterns:**
1.  **Configuration Access (`Config`):**
    *   `config.getDebugMode()`: Checks if debug mode is enabled.
    *   `config.getUserMemory()`: Retrieves the current user memory content.
    *   `config.getGeminiMdFileCount()`: Retrieves the count of `GEMINI.md` files contributing to the memory.

2.  **Displaying Memory Information:**
    *   The `createShowMemoryAction` function constructs an asynchronous action that displays information about the loaded hierarchical memory.
    *   It checks for the availability of `Config` and uses its methods to retrieve memory content and file counts.
    *   It formats and adds messages to the UI history using the `addMessage` callback.