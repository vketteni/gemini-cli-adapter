**File:** `packages/cli/src/ui/commands/ideCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `IDEConnectionStatus`

**Usage Patterns:**
1.  **Conditional Command Creation:**
    *   The `ideCommand` function takes a `Config` object as an argument. It returns `null` if `config?.getIdeMode()` is false, meaning the command is only available when IDE mode is enabled in the configuration.

2.  **`status` Subcommand:**
    *   `config.getIdeClient()?.getConnectionStatus()`: Retrieves the current connection status of the IDE integration.
    *   `IDEConnectionStatus`: The enum is used to interpret and display the connection status (e.g., `Connected`, `Connecting`, `Disconnected`).

3.  **`install` Subcommand:**
    *   This subcommand is responsible for installing the VS Code companion extension. It uses `child_process.execSync` to run shell commands (like `code --install-extension`).
