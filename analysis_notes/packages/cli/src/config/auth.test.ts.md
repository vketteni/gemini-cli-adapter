**File:** `packages/cli/src/config/auth.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `AuthType`

**Usage Patterns:**
1.  **Testing `validateAuthMethod`:**
    *   `AuthType.LOGIN_WITH_GOOGLE`, `AuthType.CLOUD_SHELL`, `AuthType.USE_GEMINI`, `AuthType.USE_VERTEX_AI`: Used as parameters to test the `validateAuthMethod` function, verifying correct behavior based on environment variables.
