**File:** `packages/cli/src/config/auth.ts`

**Imports from `@google/gemini-cli-core`:**
- `AuthType`

**Usage Patterns:**
1.  **Authentication Method Validation (`validateAuthMethod` function):**
    *   `AuthType.LOGIN_WITH_GOOGLE`, `AuthType.CLOUD_SHELL`, `AuthType.USE_GEMINI`, `AuthType.USE_VERTEX_AI`: These `AuthType` enums are used to determine which authentication method is being validated.
    *   The function checks for the presence of specific environment variables (`GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_API_KEY`) based on the selected `AuthType` to ensure the chosen method is properly configured.
