**File:** `packages/cli/src/services/CommandService.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Command Loading and Aggregation (`CommandService.create` static method):**
    *   Takes an array of `ICommandLoader` instances.
    *   Uses `Promise.allSettled` to run loaders in parallel.
    *   Aggregates commands from all successful loaders.
    *   Implements conflict resolution logic:
        *   Extension commands are renamed (e.g., `extensionName.commandName`) if they conflict with existing commands.
        *   Non-extension commands (built-in, user, project) override earlier commands with the same name based on loader order.
