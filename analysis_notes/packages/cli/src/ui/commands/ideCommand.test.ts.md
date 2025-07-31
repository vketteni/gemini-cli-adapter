**File:** `packages/cli/src/ui/commands/ideCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `IDEConnectionStatus`

**Usage Patterns:**
1.  **Mocking `Config`:**
    *   `mockConfig.getIdeMode()`: Used to control whether IDE mode is enabled.
    *   `mockConfig.getIdeClient()`: Used to mock the IDE client and its `getConnectionStatus` method.

2.  **Testing `status` Subcommand:**
    *   Asserts that the `status` subcommand correctly displays connection status based on `IDEConnectionStatus` enum values (`Connected`, `Connecting`, `Disconnected`).

3.  **Testing `install` Subcommand:**
    *   Tests the installation of the VS Code companion extension.
    *   Mocks `child_process.execSync` to simulate `code` command execution and `glob.sync` to find `.vsix` files.
