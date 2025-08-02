**File:** `packages/cli/src/ui/hooks/useToolScheduler.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`
- `ToolCallRequestInfo`
- `Tool`
- `ToolRegistry`
- `ToolResult`
- `ToolCallConfirmationDetails`
- `ToolConfirmationOutcome`
- `ToolCallResponseInfo`
- `ToolCall`
- `Status` (aliased as `ToolCallStatusType`)
- `ApprovalMode`
- `Icon`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `ToolRegistry`: Mocked to control the behavior of `getTool` for testing tool lookup.
    *   `Config`: Mocked to control `getToolRegistry`, `getApprovalMode`, `getUsageStatisticsEnabled`, and `getDebugMode`.
    *   `Tool`: A mock `Tool` object is defined with mocked `execute`, `shouldConfirmExecute`, and `getDescription` methods to simulate tool behavior.
    *   `ApprovalMode`: Used to set the approval mode for testing YOLO (auto-accept) functionality.

2.  **Testing Tool Scheduling and Execution:**
    *   Tests cover successful tool execution, handling of tool not found errors, and errors during confirmation or execution.
    *   It verifies that `mockTool.execute` is called with the correct arguments and that `onComplete` is called with the expected results.

3.  **Testing Tool Confirmation:**
    *   Tests (skipped in the provided code) are designed to verify the behavior when a tool requires confirmation, including approval and cancellation scenarios.
    *   `ToolCallConfirmationDetails` and `ToolConfirmationOutcome` are used in these tests to simulate the confirmation flow.

4.  **Testing Live Output:**
    *   Tests (skipped in the provided code) are designed to verify how live output updates from tools are handled.

5.  **Testing Multiple Tool Calls:**
    *   Tests verify that multiple tool calls can be scheduled and executed concurrently.

6.  **`mapToDisplay` Function Testing:**
    *   This section extensively tests the `mapToDisplay` function, which transforms `ToolCall` objects (from `@google/gemini-cli-core`) into `HistoryItemToolGroup` objects for UI display.
    *   It covers various `ToolCallStatusType` values (`validating`, `awaiting_approval`, `scheduled`, `executing`, `success`, `error`, `cancelled`) and asserts that they are correctly mapped to `ToolCallStatus` for display.
    *   It also verifies that tool-specific properties like `displayName`, `description`, `resultDisplay`, and `confirmationDetails` are correctly extracted and presented.