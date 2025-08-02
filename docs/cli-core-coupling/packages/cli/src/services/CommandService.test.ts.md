**File:** `packages/cli/src/services/CommandService.test.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Testing Command Aggregation and Conflict Resolution:**
    *   The tests simulate loading commands from multiple `ICommandLoader` instances.
    *   It verifies that commands from later loaders override those from earlier loaders if they have the same name.
    *   It specifically tests the renaming logic for extension commands that conflict with existing commands (e.g., `deploy` becoming `firebase.deploy`).
