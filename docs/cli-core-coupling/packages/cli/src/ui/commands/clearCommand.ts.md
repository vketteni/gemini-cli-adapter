**File:** `packages/cli/src/ui/commands/clearCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- `uiTelemetryService`

**Usage Patterns:**
1.  **Command Action (`action` method):**
    *   `context.services.config?.getGeminiClient()`: Retrieves the Gemini client from the command context.
    *   `geminiClient.resetChat()`: Resets the chat history in the Gemini client.
    *   `uiTelemetryService.resetLastPromptTokenCount()`: Resets the last prompt token count for telemetry purposes.
