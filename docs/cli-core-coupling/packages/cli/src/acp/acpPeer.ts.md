**File:** `packages/cli/src/acp/acpPeer.ts`

**Imports from `@google/gemini-cli-core`:**
- `AuthType`, `Config`, `GeminiChat`, `ToolRegistry`, `logToolCall`, `ToolResult`, `convertToFunctionResponse`, `ToolCallConfirmationDetails`, `ToolConfirmationOutcome`, `clearCachedCredentialFile`, `isNodeError`, `getErrorMessage`, `isWithinRoot`, `getErrorStatus`

**Usage Patterns:**
1.  **Authentication:**
    *   `config.refreshAuth(settings.merged.selectedAuthType)`: Refreshes authentication.
    *   `clearCachedCredentialFile()`: Clears cached credentials.
    *   `AuthType.LOGIN_WITH_GOOGLE`: Specific auth type used.
2.  **Chat Interaction:**
    *   `config.getGeminiClient()`: Retrieves Gemini client.
    *   `geminiClient.startChat()`: Initiates chat session.
    *   `chat.sendMessageStream(...)`: Sends messages to Gemini model.
    *   `chat.addHistory(...)`: Adds messages to chat history.
3.  **Tool Execution:**
    *   `config.getToolRegistry()`: Retrieves tool registry.
    *   `toolRegistry.getTool(...)`: Fetches tool.
    *   `tool.shouldConfirmExecute(...)`: Checks for confirmation.
    *   `tool.execute(...)`: Executes tool.
    *   `logToolCall(...)`: Logs tool events.
    *   `convertToFunctionResponse(...)`: Converts tool results for Gemini.
4.  **File Handling:**
    *   `config.getFileService()`: Retrieves file discovery service.
    *   `config.getFileFilteringRespectGitIgnore()`: Checks gitignore setting.
    *   `fileDiscovery.shouldGitIgnoreFile(...)`: Checks if file is git-ignored.
    *   `isWithinRoot(...)`: Checks path within root.
    *   `config.getEnableRecursiveFileSearch()`: Checks recursive search setting.
5.  **Error Handling:**
    *   `getErrorStatus(...)`: Extracts error status.
    *   `isNodeError(...)`: Checks for Node.js errors.
    *   `getErrorMessage(...)`: Retrieves error message.
