**File:** `packages/cli/src/ui/commands/types.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `GitService`, `Logger`

**Usage Patterns:**
1.  **`CommandContext` Interface:**
    *   `config: Config | null`: The `CommandContext` includes a `Config` object, which can be `null`. This indicates that commands might depend on the global configuration.
    *   `git: GitService | undefined`: The `CommandContext` can optionally include a `GitService` instance, suggesting that some commands interact with Git.
    *   `logger: Logger`: The `CommandContext` includes a `Logger` instance, indicating that commands can log information.

2.  **`SlashCommandActionReturn` Type:**
    *   This union type defines all possible return types for a command's `action` method. These types (`ToolActionReturn`, `MessageActionReturn`, `QuitActionReturn`, `OpenDialogActionReturn`, `LoadHistoryActionReturn`, `SubmitPromptActionReturn`, `ConfirmShellCommandsActionReturn`) dictate how the CLI's UI and core logic should respond after a command is executed.
