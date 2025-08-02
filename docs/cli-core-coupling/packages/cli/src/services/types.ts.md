**File:** `packages/cli/src/services/types.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **`ICommandLoader` Interface:**
    *   Defines a single method `loadCommands`, which returns a `Promise` resolving to an array of `SlashCommand` objects.
    *   The interface mentions that "Loaders should receive any necessary dependencies (like Config) via their constructor," implying a dependency on the `Config` object, though not directly imported in this file.
