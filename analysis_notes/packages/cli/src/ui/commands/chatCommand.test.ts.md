**File:** `packages/cli/src/ui/commands/chatCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `GeminiClient`

**Usage Patterns:**
1.  **Mocking `GeminiClient`:**
    *   `mockGetChat`: Mocked to return a chat object with a `getHistory` method.
    *   `mockContext.services.config.getGeminiClient()`: Used to retrieve the mocked `GeminiClient` instance.

2.  **Testing Chat History Management:**
    *   `mockContext.services.config.getProjectTempDir()`: Used to get the temporary directory for checkpoints.
    *   `mockSaveCheckpoint`, `mockLoadCheckpoint`, `mockDeleteCheckpoint`: Mocks for logger functions that interact with conversation checkpoints.
    *   `mockGetHistory`: Mock for the chat's `getHistory` method.
