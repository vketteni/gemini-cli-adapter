**File:** `packages/cli/src/services/FileCommandLoader.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `getProjectCommandsDir`, `getUserCommandsDir`, `isCommandAllowed`, `ShellExecutionService`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to control project root and extensions during tests.
    *   `getProjectCommandsDir`, `getUserCommandsDir`: Used to determine paths for command files.
    *   `isCommandAllowed`: Mocked to simulate permission checks for shell commands.
    *   `ShellExecutionService`: Mocked to simulate shell command execution.

2.  **Testing File Command Loading:**
    *   Tests cover loading single/multiple commands, nested namespaces, handling TOML errors, and default descriptions.
    *   Tests also verify the integration with `ShellProcessor` and `ShorthandArgumentProcessor` for handling shell injections and argument placeholders.
