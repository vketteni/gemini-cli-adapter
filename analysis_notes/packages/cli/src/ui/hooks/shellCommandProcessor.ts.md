**File:** `packages/cli/src/ui/hooks/shellCommandProcessor.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `GeminiClient`, `isBinary`, `ShellExecutionService`

**Usage Patterns:**
1.  **Shell Command Execution (`handleShellCommand` function):**
    *   `config.getTargetDir()`: Retrieves the current working directory for command execution.
    *   `ShellExecutionService.execute(...)`: Executes the shell command. This is the primary interaction with the core module for running shell commands.
    *   `isBinary(result.rawOutput)`: Checks if the raw output from the shell command is binary.
    *   `geminiClient.addHistory(...)`: Adds the shell command and its output to the Gemini model's conversation history.
