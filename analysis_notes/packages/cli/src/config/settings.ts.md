**File:** `packages/cli/src/config/settings.ts`

**Imports from `@google/gemini-cli-core`:**
- `MCPServerConfig`, `GEMINI_CONFIG_DIR`, `getErrorMessage`, `BugCommandSettings`, `TelemetrySettings`, `AuthType`

**Usage Patterns:**
1.  **Settings Interfaces:**
    *   `MCPServerConfig`: Used within the `Settings` interface to define the structure for MCP server configurations.
    *   `BugCommandSettings`: Used within the `Settings` interface to define bug command settings.
    *   `TelemetrySettings`: Used within the `Settings` interface to define telemetry settings.
    *   `AuthType`: Used within the `Settings` interface to define the selected authentication type.

2.  **Environment Loading (`loadEnvironment` function):**
    *   `GEMINI_CONFIG_DIR`: Used to locate the `.gemini` directory for environment files.

3.  **Settings Loading (`loadSettings` function):**
    *   `getErrorMessage`: Used to retrieve error messages when reading settings files.
