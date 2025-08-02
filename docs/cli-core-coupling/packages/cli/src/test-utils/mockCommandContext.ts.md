**File:** `packages/cli/src/test-utils/mockCommandContext.ts`

**Imports from `@google/gemini-cli-core`:**
- `GitService`, `Logger`

**Usage Patterns:**
1.  **Mocking Services:**
    *   `GitService`: Mocked as `undefined` by default within `services.git`. This indicates that `CommandContext` can optionally contain a `GitService` instance.
    *   `Logger`: Mocked with `vi.fn()` for its methods (`log`, `logMessage`, `saveCheckpoint`, `loadCheckpoint`). This shows that `CommandContext` includes a `Logger` instance.
