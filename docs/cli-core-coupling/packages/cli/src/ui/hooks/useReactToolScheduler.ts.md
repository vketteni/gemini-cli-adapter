**File:** `packages/cli/src/ui/hooks/useReactToolScheduler.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`
- `ToolCallRequestInfo`
- `ExecutingToolCall`
- `ScheduledToolCall`
- `ValidatingToolCall`
- `WaitingToolCall`
- `CompletedToolCall`
- `CancelledToolCall`
- `CoreToolScheduler`
- `OutputUpdateHandler`
- `AllToolCallsCompleteHandler`
- `ToolCallsUpdateHandler`
- `Tool`
- `ToolCall`
- `Status` (aliased as `CoreStatus`)
- `EditorType`

**Usage Patterns:**
1.  **CoreToolScheduler Initialization and Usage:**
    *   `new CoreToolScheduler(...)`: An instance of `CoreToolScheduler` is created, which is the central component for managing tool call lifecycles.
    *   It is initialized with `config.getToolRegistry()`, `outputUpdateHandler`, `allToolCallsCompleteHandler`, `toolCallsUpdateHandler`, `getPreferredEditor`, and `config` itself.
    *   `scheduler.schedule(request, signal)`: The `schedule` function (returned by the hook) delegates to the `CoreToolScheduler` to schedule new tool calls.

2.  **Tool Call State Management:**
    *   Various types like `ExecutingToolCall`, `ScheduledToolCall`, `ValidatingToolCall`, `WaitingToolCall`, `CompletedToolCall`, `CancelledToolCall` are imported to define the different states a tool call can be in within the scheduler.
    *   `ToolCallRequestInfo`: Used to define the structure of a tool call request.
    *   `Tool` and `ToolCall`: Represent the tool definition and an instance of a tool call, respectively.

3.  **Handlers for Scheduler Events:**
    *   `OutputUpdateHandler`: A callback type for handling updates to a tool call's output.
    *   `AllToolCallsCompleteHandler`: A callback type for when all scheduled tool calls are complete.
    *   `ToolCallsUpdateHandler`: A callback type for when the status of tool calls updates.

4.  **Configuration Access (`Config`):**
    *   `config.getToolRegistry()`: Retrieves the tool registry, which is essential for the `CoreToolScheduler` to find and execute tools.

5.  **Status Mapping:**
    *   `Status` (aliased as `CoreStatus`): An enum from `@google/gemini-cli-core` that defines the internal statuses of tool calls within the core scheduler. This is mapped to the UI's `ToolCallStatus` enum for display purposes.

6.  **Editor Preference:**
    *   `EditorType`: Used to pass the preferred editor type to the `CoreToolScheduler`.