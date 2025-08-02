**File:** `packages/cli/src/ui/hooks/useTimer.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Timer Logic:**
    *   This hook implements a simple timer that increments every second.
    *   It uses `useState` to manage the `elapsedTime` and `useRef` to store the `setInterval` ID.
    *   The timer's behavior is controlled by the `isActive` and `resetKey` parameters.
    *   It does not interact with `@google/gemini-cli-core`.