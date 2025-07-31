**File:** `packages/cli/src/ui/commands/initCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Mocking `Config`:**
    *   `mockContext.services.config.getTargetDir()`: Used to get the target directory for creating `GEMINI.md`.

2.  **Testing `initCommand` Functionality:**
    *   Tests verify that the command checks for an existing `GEMINI.md` file.
    *   It asserts that a new `GEMINI.md` file is created if it doesn't exist.
    *   It verifies that a specific prompt is submitted for project analysis after creating the file.
    *   It handles cases where the `config` service is not available.
