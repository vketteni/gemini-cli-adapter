**File:** `packages/cli/src/ui/hooks/useConsoleMessages.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Message Management:**
    *   Uses `useReducer` to manage the state of `consoleMessages`.
    *   `handleNewMessage`: Adds new messages to a queue and dispatches them to the reducer after a short delay (throttling).
    *   `clearConsoleMessages`: Clears all messages from the state.