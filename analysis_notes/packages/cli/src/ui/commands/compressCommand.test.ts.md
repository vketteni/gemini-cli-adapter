**File:** `packages/cli/src/ui/commands/compressCommand.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `GeminiClient`

**Usage Patterns:**
1.  **Mocking `GeminiClient`:**
    *   `mockTryCompressChat`: Mocked to simulate the `tryCompressChat` method of `GeminiClient`.
    *   `context.services.config.getGeminiClient()`: Used to retrieve the mocked `GeminiClient` instance.

2.  **Testing Compression Functionality:**
    *   Tests verify that `compressCommand` sets a pending item, calls `tryCompressChat`, and updates the UI based on the compression result (success, falsy result, or error).
    *   It also ensures that the pending item is cleared in a `finally` block.
