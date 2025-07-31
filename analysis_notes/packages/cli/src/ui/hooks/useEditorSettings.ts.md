**File:** `packages/cli/src/ui/hooks/useEditorSettings.ts`

**Imports from `@google/gemini-cli-core`:**
- `allowEditorTypeInSandbox`
- `checkHasEditorType`
- `EditorType`

**Usage Patterns:**
1.  **Editor Type Validation:**
    *   `checkHasEditorType(editorType)`: Used to determine if a given `editorType` is available.
    *   `allowEditorTypeInSandbox(editorType)`: Used to determine if a given `editorType` is allowed in a sandboxed environment.

2.  **Setting Editor Preference:**
    *   `loadedSettings.setValue(scope, 'preferredEditor', editorType)`: This function is called to persist the user's preferred editor in the settings. The `editorType` is passed directly to this function.