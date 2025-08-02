**File:** `packages/cli/src/services/FileCommandLoader.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `getProjectCommandsDir`, `getUserCommandsDir`

**Usage Patterns:**
1.  **Constructor (`FileCommandLoader` class):**
    *   Takes a `Config` object (or `null`) as a dependency.
    *   Uses `config?.getProjectRoot()` to determine the project root, falling back to `process.cwd()`.

2.  **Command Directory Discovery (`getCommandDirectories` method):**
    *   `getUserCommandsDir()`: Retrieves the user's global commands directory.
    *   `getProjectCommandsDir(this.projectRoot)`: Retrieves the project-specific commands directory.
    *   `this.config?.getExtensions()`: Accesses active extensions from the `Config` object to load extension-provided commands.
