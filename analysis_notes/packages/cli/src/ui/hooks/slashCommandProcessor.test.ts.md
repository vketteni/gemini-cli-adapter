**File:** `packages/cli/src/ui/hooks/slashCommandProcessor.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `ToolConfirmationOutcome`, `logSlashCommand`, `SlashCommandEvent`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to provide `getProjectRoot`, `getSessionId`, `getGeminiClient` (specifically `setHistory`), and `getExtensions`.
    *   `logSlashCommand`, `SlashCommandEvent`: Hoisted mocks to verify telemetry logging of slash command usage.
    *   `ToolConfirmationOutcome`: Used in tests for shell command confirmation flow.

2.  **Testing Command Loading and Precedence:**
    *   Tests verify that `CommandService` is initialized with `BuiltinCommandLoader`, `FileCommandLoader`, and `McpPromptLoader`.
    *   It asserts that file-based commands override built-in commands, and that commands with primary names take precedence over aliases.

3.  **Testing Command Execution and Action Handling:**
    *   Tests cover executing top-level and nested subcommands.
    *   It asserts that `logSlashCommand` and `SlashCommandEvent` are called for executed commands.
    *   It verifies handling of various action return types: `dialog` (for help, auth), `load_history`, `quit`, `submit_prompt`.

4.  **Shell Command Confirmation Flow:**
    *   Tests the `confirm_shell_commands` action, ensuring that the confirmation request is set and that commands are re-run with a one-time or session-wide allowlist based on user confirmation (`ToolConfirmationOutcome.ProceedOnce`, `ToolConfirmationOutcome.ProceedAlways`).
