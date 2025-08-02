**File:** `packages/cli/src/ui/hooks/useTerminalSize.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Terminal Size Detection:**
    *   This hook uses `process.stdout.columns` and `process.stdout.rows` to detect the current terminal dimensions.
    *   It listens for the `resize` event on `process.stdout` to update the terminal size dynamically.
    *   It does not interact with `@google/gemini-cli-core`.