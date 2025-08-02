**File:** `packages/cli/src/ui/hooks/useAutoAcceptIndicator.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `ApprovalMode`

**Usage Patterns:**
1.  **Mocking `Config`:**
    *   `Config`: Mocked to control `getApprovalMode` and `setApprovalMode` methods. This allows testing how the hook interacts with and updates the global configuration for auto-acceptance.

2.  **Testing Auto-Acceptance Toggling:**
    *   Tests verify that the indicator's state changes correctly when `Shift+Tab` (for `AUTO_EDIT`) or `Ctrl+Y` (for `YOLO`) are pressed.
    *   It asserts that `config.setApprovalMode` is called with the appropriate `ApprovalMode` enum value (`DEFAULT`, `AUTO_EDIT`, `YOLO`).
    *   It also checks that the indicator updates when the `Config`'s approval mode changes externally.
