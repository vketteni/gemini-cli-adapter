**File:** `packages/cli/src/ui/hooks/atCommandProcessor.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `FileDiscoveryService`, `GlobTool`, `ReadManyFilesTool`, `ToolRegistry`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to control `getTargetDir`, `isSandboxed`, `getFileService`, `getFileFilteringRespectGitIgnore`, `getFileFilteringRespectGeminiIgnore`, `getFileFilteringOptions`, and `getEnableRecursiveFileSearch`.
    *   `FileDiscoveryService`: Used to simulate file system interactions and gitignore checks.
    *   `GlobTool`, `ReadManyFilesTool`: These are actual tool implementations from `@google/gemini-cli-core` that are registered with a mocked `ToolRegistry`. This indicates that `handleAtCommand` directly uses these tools.

2.  **Testing `@` Command Processing:**
    *   Tests cover various scenarios: valid file paths, directory paths (converted to glob), mixed text and `@` commands, multiple `@` references, and handling invalid/non-existent paths.
    *   It verifies that `ReadManyFilesTool.execute` is called to read file contents.
    *   It asserts that `GlobTool.execute` is called for recursive file searches when a direct path is not found.
    *   Tests also cover git-aware and `.geminiignore` filtering, ensuring that ignored files are skipped.
