**File:** `packages/cli/src/services/BuiltinCommandLoader.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`

**Usage Patterns:**
1.  **Mocking `Config`:**
    *   `mockConfig = { some: 'config' } as unknown as Config;`: A mock `Config` object is created and passed to the `BuiltinCommandLoader` constructor. This indicates that the `BuiltinCommandLoader` depends on the `Config` object.

2.  **Testing Command Factory Functions:**
    *   `ideCommandMock` and `restoreCommandMock` (which are mocks of functions that return `SlashCommand` objects) are asserted to be called with the `mockConfig` object. This implies that some built-in commands are factory functions that take `Config` as a dependency.
