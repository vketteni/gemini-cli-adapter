**File:** `packages/cli/src/ui/hooks/useEditorSettings.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `EditorType`
- `checkHasEditorType`
- `allowEditorTypeInSandbox`

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `checkHasEditorType`: Mocked to control whether a given editor type is considered available.
    *   `allowEditorTypeInSandbox`: Mocked to control whether a given editor type is allowed in a sandboxed environment.

2.  **Testing Editor Preference Setting:**
    *   Tests verify that `handleEditorSelect` attempts to set the preferred editor using `mockLoadedSettings.setValue`.
    *   It asserts that `checkHasEditorType` and `allowEditorTypeInSandbox` are called to validate the editor before setting the preference.
    *   It checks for proper handling of successful preference setting, clearing preferences, and error scenarios during setting.

3.  **Dialog Management:**
    *   Tests confirm that `openEditorDialog` and `exitEditorDialog` correctly control the `isEditorDialogOpen` state.