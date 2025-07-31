**File:** `packages/cli/src/ui/hooks/useBracketedPaste.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Terminal Control:**
    *   Uses ANSI escape codes (`\x1b[?2004h` and `\x1b[?2004l`) to enable and disable bracketed paste mode by writing directly to `process.stdout`.
    *   Registers event listeners for `exit`, `SIGINT`, and `SIGTERM` signals to ensure cleanup (disabling bracketed paste mode) when the process terminates.
