**File:** `packages/cli/src/ui/commands/restoreCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `GitService`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to control `getCheckpointingEnabled`, `getProjectTempDir`, and `getGeminiClient` (specifically its `setHistory` method).
    *   `GitService`: Mocked to control `restoreProjectFromSnapshot`.

2.  **Testing Restore Functionality:**
    *   Tests verify that the command is only available when checkpointing is enabled.
    *   It checks for proper handling of missing temporary directories and checkpoint files.
    *   It asserts that `mockContext.ui.loadHistory` and `mockSetHistory` (from `GeminiClient`) are called to restore chat history.
    *   It verifies that `mockGitService.restoreProjectFromSnapshot` is called to restore the project's Git state.
    *   Tests also cover error handling during file operations and invalid checkpoint data.
