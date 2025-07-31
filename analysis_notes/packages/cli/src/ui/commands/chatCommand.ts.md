**File:** `packages/cli/src/ui/commands/chatCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Accessing Configuration and Services:**
    *   `context.services.config?.getProjectTempDir()`: Used to get the temporary directory for storing chat checkpoints.
    *   `context.services.config?.getGeminiClient()?.getChat()`: Used to access the current chat history from the Gemini client.
    *   `context.services.logger`: Used to interact with the logger service for saving, loading, and deleting conversation checkpoints.
