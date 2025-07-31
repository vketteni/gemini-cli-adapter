**File:** `packages/cli/src/ui/hooks/useConsoleMessages.test.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Message Management:**
    *   Tests verify that the hook initializes with an empty array.
    *   It asserts that new messages are added correctly.
    *   It checks that identical consecutive messages are batched and counted.
    *   It verifies that different messages are not batched.
    *   It asserts that all messages are cleared when `clearConsoleMessages` is called.
    *   It ensures proper cleanup of timers on unmount.