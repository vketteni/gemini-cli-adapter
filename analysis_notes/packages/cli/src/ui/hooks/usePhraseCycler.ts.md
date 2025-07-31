**File:** `packages/cli/src/ui/hooks/usePhraseCycler.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Phrase Cycling Logic:**
    *   This hook manages the display of witty loading phrases.
    *   It uses `useState` to hold the `currentLoadingPhrase` and `useRef` to manage the `setInterval` for cycling through phrases.
    *   The phrases are defined in the `WITTY_LOADING_PHRASES` array within the same file.
    *   It does not interact with `@google/gemini-cli-core`.