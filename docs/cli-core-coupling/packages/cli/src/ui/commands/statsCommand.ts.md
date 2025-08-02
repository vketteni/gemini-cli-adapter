**File:** `packages/cli/src/ui/commands/statsCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Accessing Session Statistics:**
    *   `context.session.stats.sessionStartTime`: Used to get the start time of the current session to calculate its duration.
    *   `context.ui.addItem(...)`: Used to add various types of statistics messages (`MessageType.STATS`, `MessageType.MODEL_STATS`, `MessageType.TOOL_STATS`) to the UI history.
