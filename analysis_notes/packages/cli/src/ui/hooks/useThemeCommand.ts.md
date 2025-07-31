**File:** `packages/cli/src/ui/hooks/useThemeCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- None from `@google/gemini-cli-core` directly.

**Usage Patterns:**
1.  **Theme Management:**
    *   This hook manages the UI for theme selection and application.
    *   It interacts with `themeManager` (from `../themes/theme-manager.js`) to find, set, and load themes.
    *   It uses `LoadedSettings` (from `../../config/settings.js`) to read and write theme preferences (e.g., `loadedSettings.setValue(scope, 'theme', themeName)`).
    *   It checks the `NO_COLOR` environment variable to determine if theme configuration is available.
    *   It does not directly import or interact with `@google/gemini-cli-core`.