**File:** `packages/cli/src/ui/hooks/useAuthCommand.ts`

**Imports from `@google/gemini-cli-core`:**
- `AuthType`, `Config`, `clearCachedCredentialFile`, `getErrorMessage`

**Usage Patterns:**
1.  **Authentication Flow (`authFlow` in `useEffect`):**
    *   `config.refreshAuth(authType)`: This is the core function for refreshing authentication based on the selected `AuthType`.
    *   `getErrorMessage(e)`: Used to format error messages during authentication.

2.  **Authentication Selection (`handleAuthSelect` function):**
    *   `clearCachedCredentialFile()`: Clears any cached credentials before setting a new authentication type.
    *   `settings.setValue(scope, 'selectedAuthType', authType)`: Updates the `selectedAuthType` in the user's settings.
    *   `config.isBrowserLaunchSuppressed()`: Checks if browser launch is suppressed, which affects the authentication flow for `LOGIN_WITH_GOOGLE`.
