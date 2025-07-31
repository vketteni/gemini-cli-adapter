**File:** `packages/cli/src/services/BuiltinCommandLoader.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`

**Usage Patterns:**
1.  **Constructor (`BuiltinCommandLoader` class):**
    *   Takes a `Config` object (or `null`) as a dependency. This `Config` object is then passed to certain command factory functions.

2.  **Command Factory Functions:**
    *   `ideCommand(this.config)`: The `ideCommand` is a function that takes the `Config` object as an argument.
    *   `restoreCommand(this.config)`: The `restoreCommand` is also a function that takes the `Config` object as an argument.
