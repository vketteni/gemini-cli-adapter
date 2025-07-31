**File:** `packages/cli/src/services/prompt-processors/shellProcessor.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `checkCommandPermissions`, `ShellExecutionService`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to provide `getTargetDir` for shell execution.
    *   `checkCommandPermissions`: Mocked to simulate permission checks for shell commands.
    *   `ShellExecutionService`: Mocked to simulate shell command execution.

2.  **Testing Shell Command Processing:**
    *   Tests verify that `ShellProcessor` correctly identifies and processes shell injections (`!{...}`).
    *   It asserts that `checkCommandPermissions` is called to validate commands.
    *   It verifies that `ShellExecutionService.execute` is called for allowed commands.
    *   Tests cover scenarios where commands are disallowed, requiring confirmation (`ConfirmationRequiredError`).
    *   It also tests the interaction with the session's allowlist for shell commands.
