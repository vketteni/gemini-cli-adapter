**File:** `packages/cli/src/ui/commands/clearCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `GeminiClient`, `uiTelemetryService`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `GeminiClient`: Mocked to control the `resetChat` method.
    *   `uiTelemetryService`: Mocked to control the `resetLastPromptTokenCount` method.

2.  **Testing Clear Command Functionality:**
    *   Tests verify that `clearCommand` calls `resetChat` on the `GeminiClient` and `resetLastPromptTokenCount` on `uiTelemetryService`.
    *   It also checks the order of these operations and ensures graceful handling when the `config` service is unavailable.
