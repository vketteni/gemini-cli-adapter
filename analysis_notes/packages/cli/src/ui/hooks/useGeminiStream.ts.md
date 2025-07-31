**File:** `packages/cli/src/ui/hooks/useGeminiStream.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`
- `GeminiClient`
- `GeminiEventType` (aliased as `ServerGeminiEventType`)
- `ServerGeminiStreamEvent` (aliased as `GeminiEvent`)
- `ServerGeminiContentEvent` (aliased as `ContentEvent`)
- `ServerGeminiErrorEvent` (aliased as `ErrorEvent`)
- `ServerGeminiChatCompressedEvent`
- `ServerGeminiFinishedEvent`
- `getErrorMessage`
- `isNodeError`
- `MessageSenderType`
- `ToolCallRequestInfo`
- `logUserPrompt`
- `GitService`
- `EditorType`
- `ThoughtSummary`
- `UnauthorizedError`
- `UserPromptEvent`
- `DEFAULT_GEMINI_FLASH_MODEL`

**Usage Patterns:**
1.  **Gemini Client Interaction:**
    *   `geminiClient.sendMessageStream(...)`: Sends a query to the Gemini model and receives a stream of events.
    *   `geminiClient.addHistory(...)`: Adds messages (including tool responses) to the Gemini model's conversation history.
    *   `geminiClient.getHistory()`: Retrieves the current conversation history from the Gemini client.

2.  **Configuration Access (`Config`):**
    *   `config.getProjectRoot()`: Used to determine the project root for `GitService` initialization.
    *   `config.getContentGeneratorConfig()?.authType`: Retrieves the authentication type for error formatting and user prompt logging.
    *   `config.getModel()`: Retrieves the current Gemini model being used.
    *   `config.getSessionId()`: Used to generate a unique prompt ID.
    *   `config.getMaxSessionTurns()`: Retrieves the maximum number of turns allowed in a session.
    *   `config.getCheckpointingEnabled()`: Checks if checkpointing is enabled.
    *   `config.getProjectTempDir()`: Retrieves the temporary directory for storing checkpoints.
    *   `config.setQuotaErrorOccurred()`: Sets a flag if a quota error occurred.

3.  **Event Handling (from Gemini Stream):**
    *   `ServerGeminiEventType.Thought`: Processes thought events from the Gemini stream.
    *   `ServerGeminiEventType.Content`: Processes content events, buffering and adding them to history.
    *   `ServerGeminiEventType.ToolCallRequest`: Collects tool call requests from the stream.
    *   `ServerGeminiEventType.UserCancelled`: Handles user-initiated cancellation events.
    *   `ServerGeminiEventType.Error`: Handles error events, formatting and displaying them.
    *   `ServerGeminiEventType.ChatCompressed`: Handles chat compression events, displaying an info message.
    *   `ServerGeminiEventType.MaxSessionTurns`: Handles max session turns events, displaying an info message.
    *   `ServerGeminiEventType.Finished`: Handles finished events, displaying messages for various `FinishReason` values.
    *   `ServerGeminiEventType.LoopDetected`: Handles loop detected events.

4.  **Tool Call Management:**
    *   `ToolCallRequestInfo`: Used to define the structure of tool call requests.
    *   `scheduleToolCalls(...)`: Schedules tool calls for execution.
    *   `markToolsAsSubmitted(...)`: Marks tool calls as submitted to Gemini.

5.  **Error Handling:**
    *   `getErrorMessage(...)`: Retrieves a user-friendly error message from an error object.
    *   `isNodeError(...)`: Checks if an error is a Node.js system error.
    *   `parseAndFormatApiError(...)`: Formats API errors for display.
    *   `UnauthorizedError`: Specifically handles unauthorized errors, triggering an authentication error callback.

6.  **Git Integration:**
    *   `GitService`: Used to create file snapshots and get the current commit hash for checkpointing.

7.  **Telemetry:**
    *   `logUserPrompt(...)`: Logs user prompt events for telemetry.
    *   `UserPromptEvent`: Used to create user prompt telemetry events.

8.  **Other Utilities:**
    *   `MessageSenderType`: Used to categorize message senders (e.g., `USER`).
    *   `EditorType`: Used in conjunction with `getPreferredEditor` for tool scheduling.
    *   `ThoughtSummary`: Used to display thoughts from the Gemini model.
    *   `DEFAULT_GEMINI_FLASH_MODEL`: Used as a fallback model in error formatting.
    *   `mergePartListUnions`: Utility for merging `PartListUnion` arrays.
    *   `findLastSafeSplitPoint`: Utility for splitting large markdown messages.
    *   `isAtCommand`: Checks if a query is an `@` command.
    *   `handleAtCommand`: Processes `@` commands, potentially involving tool calls.
    *   `useShellCommandProcessor`: Custom hook for handling shell commands.
    *   `useReactToolScheduler`: Custom hook for scheduling and managing tool calls.
    *   `useLogger`: Custom hook for logging messages.
    *   `useSessionStats`: Custom hook for session statistics.
    *   `useStateAndRef`: Custom hook for managing state and refs.