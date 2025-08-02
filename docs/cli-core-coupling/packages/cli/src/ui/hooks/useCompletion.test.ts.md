**File:** `packages/cli/src/ui/hooks/useCompletion.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `FileDiscoveryService`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to control `getTargetDir`, `getProjectRoot`, `getFileFilteringOptions`, `getEnableRecursiveFileSearch`, and `getFileService`. These methods are crucial for file path completion, especially for git-aware filtering and recursive searches.
    *   `FileDiscoveryService`: Mocked to simulate file system interactions and gitignore checks during file path completion.

2.  **Testing Command Completion (`/`):**
    *   Tests cover suggesting top-level commands, filtering by partial input, and suggesting sub-commands.
    *   It also verifies that suggestions are not provided for perfectly typed commands or unknown commands.

3.  **Testing File Path Completion (`@`):**
    *   Tests cover using glob for top-level completions, handling directory-specific completions, and including dotfiles.
    *   It asserts that git-ignored entries are filtered out from suggestions.
    *   It verifies that recursive search is controlled by the `Config` settings.

4.  **`handleAutocomplete` Function:**
    *   Tests how the `handleAutocomplete` function updates the text buffer based on the selected suggestion for both slash commands and file paths.
