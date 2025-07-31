**File:** `packages/cli/src/ui/hooks/useShellHistory.ts`

**Imports from `@google/gemini-cli-core`:**
- `isNodeError`
- `getProjectTempDir`

**Usage Patterns:**
1.  **Temporary Directory Retrieval:**
    *   `getProjectTempDir(projectRoot)`: Used to get the temporary directory path where the shell history file (`shell_history`) will be stored. This function is crucial for determining the location of the history file.

2.  **Error Handling:**
    *   `isNodeError(error)`: Used to check if an error object is a Node.js system error, specifically to identify `ENOENT` (file not found) errors when reading the history file. This allows for graceful handling when the history file does not yet exist.