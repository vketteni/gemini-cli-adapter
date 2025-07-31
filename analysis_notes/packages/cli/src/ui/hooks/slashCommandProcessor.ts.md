**File:** `packages/cli/src/ui/hooks/slashCommandProcessor.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `GitService`, `Logger`, `logSlashCommand`, `SlashCommandEvent`, `ToolConfirmationOutcome`

**Usage Patterns:**
1.  **Command Context and Services:**
    *   `Config`: The `config` object is a primary dependency, providing access to various settings and services (e.g., `getProjectRoot`, `getSessionId`, `getGeminiClient`).
    *   `GitService`: An instance of `GitService` is created and provided in the `commandContext`, indicating that commands can interact with Git.
    *   `Logger`: An instance of `Logger` is created and provided in the `commandContext`, allowing commands to log information.

2.  **Command Loading:**
    *   `CommandService.create(...)`: Uses `CommandService` along with `McpPromptLoader`, `BuiltinCommandLoader`, and `FileCommandLoader` to load all available commands.

3.  **Command Execution and Result Handling:**
    *   `logSlashCommand(config, event)`: Logs the execution of slash commands for telemetry purposes.
    *   `SlashCommandEvent`: Used to create telemetry events for slash commands.
    *   `config?.getGeminiClient()?.setHistory(result.clientHistory)`: If a command returns a `load_history` action, the Gemini client's history is updated.
    *   `ToolConfirmationOutcome`: Used in the shell command confirmation flow to determine the user's decision (e.g., `ProceedOnce`, `ProceedAlways`, `Cancel`).
