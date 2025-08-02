**File:** `packages/cli/src/ui/commands/statsCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Testing Session Statistics Display:**
    *   Tests verify that the `/stats` command (with no subcommand) displays general session statistics, including duration.
    *   It asserts that the `model` subcommand displays model-specific statistics.
    *   It asserts that the `tools` subcommand displays tool-specific statistics.
