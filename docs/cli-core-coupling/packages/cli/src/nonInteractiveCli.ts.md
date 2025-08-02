**File:** `packages/cli/src/nonInteractiveCli.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `ToolCallRequestInfo`, `executeToolCall`, `ToolRegistry`, `shutdownTelemetry`, `isTelemetrySdkInitialized`

**Usage Patterns:**
1.  **Initialization and Setup (`runNonInteractive` function):**
    *   `config.initialize()`: Initializes the configuration.
    *   `config.getGeminiClient()`: Retrieves the Gemini client.
    *   `config.getToolRegistry()`: Retrieves the tool registry.

2.  **Chat Interaction Loop:**
    *   `geminiClient.getChat()`: Gets the chat instance.
    *   `chat.sendMessageStream(...)`: Sends messages to the Gemini model and receives a streaming response.
    *   `config.getMaxSessionTurns()`: Checks the maximum number of turns allowed for the session.

3.  **Tool Execution:**
    *   `executeToolCall(...)`: Executes a tool call, passing the `config`, `ToolCallRequestInfo`, `toolRegistry`, and `abortSignal`.
    *   `ToolCallRequestInfo`: Used to structure information about a tool call request.

4.  **Telemetry:**
    *   `isTelemetrySdkInitialized()`: Checks if the telemetry SDK is initialized.
    *   `shutdownTelemetry()`: Shuts down the telemetry SDK.

5.  **Error Handling:**
    *   `config.getContentGeneratorConfig()?.authType`: Used to get the authentication type for error formatting.
