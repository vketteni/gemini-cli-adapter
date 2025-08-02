**File:** `packages/cli/src/ui/hooks/shellCommandProcessor.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `GeminiClient`, `ShellExecutionService`, `isBinary`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to provide `getTargetDir` for shell execution.
    *   `GeminiClient`: Mocked to provide `addHistory` for logging shell command results to Gemini's chat history.
    *   `ShellExecutionService`: Mocked to simulate shell command execution.
    *   `isBinary`: Mocked to simulate binary content detection in shell output.

2.  **Testing Shell Command Execution:**
    *   Tests verify that the processor initiates command execution, sets pending UI states, and updates history based on execution results (success, failure, cancellation).
    *   It asserts that `ShellExecutionService.execute` is called with the correct command and working directory.
    *   It checks for proper handling of binary output, promise rejections, and synchronous errors.
    *   It includes tests for UI streaming and throttling of output updates.
    *   It verifies that a warning is displayed if the working directory changes during a shell command execution.
