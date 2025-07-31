**File:** `packages/cli/src/ui/hooks/useAutoAcceptIndicator.ts`

**Imports from `@google/gemini-cli-core`:**
- `ApprovalMode`, `Config`

**Usage Patterns:**
1.  **Accessing and Updating Configuration:**
    *   `config.getApprovalMode()`: Retrieves the current approval mode from the `Config` object.
    *   `config.setApprovalMode(nextApprovalMode)`: Updates the approval mode in the `Config` object based on user input.

2.  **Toggling Approval Modes:**
    *   The hook listens for specific key combinations (`Ctrl+Y` for YOLO, `Shift+Tab` for AUTO_EDIT) to cycle through `ApprovalMode.DEFAULT`, `ApprovalMode.YOLO`, and `ApprovalMode.AUTO_EDIT`.
