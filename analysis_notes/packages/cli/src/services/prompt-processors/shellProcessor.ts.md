**File:** `packages/cli/src/services/prompt-processors/shellProcessor.ts`

**Imports from `@google/gemini-cli-core`:**
- `checkCommandPermissions`, `ShellExecutionService`

**Usage Patterns:**
1.  **Permission Checking (`process` method):**
    *   `checkCommandPermissions(command, config!, sessionShellAllowlist)`: This function is crucial. It takes the shell command, the `Config` object, and the session's shell allowlist to determine if the command is permitted to run. It returns information about whether the command is `allAllowed`, if there are `disallowedCommands`, a `blockReason`, and if it's a `isHardDenial`.

2.  **Shell Execution (`process` method):**
    *   `ShellExecutionService.execute(...)`: If commands are allowed, this service is used to execute the shell commands. It takes the command string, the target directory (from `config!.getTargetDir()`), a callback for streaming output (though not used for streaming in this context), and an `AbortSignal`.
