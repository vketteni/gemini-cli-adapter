**File:** `packages/cli/src/ui/hooks/useGitBranchName.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Git Command Execution:**
    *   `exec('git rev-parse --abbrev-ref HEAD', { cwd })`: Executes a Git command to get the current branch name.
    *   `exec('git rev-parse --short HEAD', { cwd })`: Executes a Git command to get the short commit hash if no branch name is found.

2.  **File System Watching:**
    *   `fsPromises.access(gitLogsHeadPath, fs.constants.F_OK)`: Checks if the `.git/logs/HEAD` file exists.
    *   `fs.watch(gitLogsHeadPath, ...)`: Sets up a file system watcher on `.git/logs/HEAD` to detect changes and re-fetch the branch name. This indicates a dependency on the local Git repository's internal structure.