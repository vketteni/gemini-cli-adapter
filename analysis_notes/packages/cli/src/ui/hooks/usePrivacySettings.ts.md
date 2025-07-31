**File:** `packages/cli/src/ui/hooks/usePrivacySettings.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`
- `CodeAssistServer`
- `UserTierId`

**Usage Patterns:**
1.  **Configuration Access (`Config`):**
    *   `config.getGeminiClient().getContentGenerator()`: Retrieves the content generator from the Gemini client, which is then cast to `CodeAssistServer`.

2.  **CodeAssistServer Interaction:**
    *   `getCodeAssistServer(config)`: A helper function that extracts and validates the `CodeAssistServer` instance from the `Config`.
    *   `server.loadCodeAssist(...)`: Used to load code assist information, including the user's tier (`UserTierId`).
    *   `server.getCodeAssistGlobalUserSetting()`: Retrieves the global user setting for data collection opt-in.
    *   `server.setCodeAssistGlobalUserSetting(...)`: Sets the global user setting for data collection opt-in.

3.  **User Tier Management:**
    *   `UserTierId.FREE`: Used to check if the user is on the free tier, which affects data collection opt-in behavior.