**File:** `packages/cli/src/ui/commands/compressCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Chat Compression (`action` method):**
    *   `context.services.config?.getGeminiClient()?.tryCompressChat(promptId, true)`: This is the core interaction. It calls the `tryCompressChat` method on the `GeminiClient` instance obtained from the `Config` service. This method is responsible for performing the actual chat history compression.
