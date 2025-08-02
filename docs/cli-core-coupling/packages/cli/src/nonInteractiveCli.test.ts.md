**File:** `packages/cli/src/nonInteractiveCli.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `GeminiClient`, `ToolRegistry`, `executeToolCall`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `Config`: Mocked to control its behavior during tests, including `getToolRegistry`, `getGeminiClient`, `getContentGeneratorConfig`, `getMaxSessionTurns`, and `initialize`.
    *   `GeminiClient`: Mocked to control chat behavior, specifically `getChat` and `sendMessageStream`.
    *   `ToolRegistry`: Mocked to control tool discovery, specifically `getFunctionDeclarations` and `getTool`.
    *   `executeToolCall`: Mocked to simulate tool execution results.

2.  **Testing Non-Interactive Flow:**
    *   Tests involve simulating various scenarios: successful text output, single tool calls, tool execution errors, API errors, and exceeding max session turns.
    *   `mockConfig.getToolRegistry()`: Used to retrieve the mocked tool registry.
    *   `mockConfig.getGeminiClient()`: Used to retrieve the mocked Gemini client.
    *   `mockConfig.getMaxSessionTurns()`: Used to control the maximum number of turns in a session.
