**File:** `packages/cli/src/ui/commands/restoreCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`

**Usage Patterns:**
1.  **Conditional Command Availability:**
    *   The `restoreCommand` function takes a `Config` object as an argument. It returns `null` if `config?.getCheckpointingEnabled()` is false, meaning the command is only available when checkpointing is enabled in the configuration.

2.  **Accessing Configuration and Services:**
    *   `context.services.config?.getProjectTempDir()`: Used to get the temporary directory where checkpoints are stored.
    *   `context.services.config?.getGeminiClient()?.setHistory(toolCallData.clientHistory)`: Used to restore the chat history in the Gemini client.
    *   `context.services.git?.restoreProjectFromSnapshot(toolCallData.commitHash)`: Used to restore the project's Git state from a snapshot.
