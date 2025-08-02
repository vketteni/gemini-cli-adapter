**File:** `packages/cli/src/ui/hooks/useLogger.ts`

**Imports from `@google/gemini-cli-core`:**
- `sessionId`
- `Logger`

**Usage Patterns:**
1.  **Logger Initialization:**
    *   `new Logger(sessionId)`: Creates a new `Logger` instance, passing `sessionId` from `@google/gemini-cli-core` to its constructor.
    *   `newLogger.initialize()`: Calls the `initialize` method on the `Logger` instance, which is an asynchronous operation.