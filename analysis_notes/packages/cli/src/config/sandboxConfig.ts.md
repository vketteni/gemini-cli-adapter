**File:** `packages/cli/src/config/sandboxConfig.ts`

**Imports from `@google/gemini-cli-core`:**
- `SandboxConfig`

**Usage Patterns:**
1.  **Sandbox Configuration (`SandboxConfig` interface):**
    *   `SandboxConfig`: Used as a type for the `config` parameter in `start_sandbox` and as the return type for `loadSandboxConfig`.
    *   `SandboxConfig['command']`: Used to define valid sandbox commands (`docker`, `podman`, `sandbox-exec`).

2.  **Loading Sandbox Configuration (`loadSandboxConfig` function):**
    *   Retrieves sandbox options from CLI arguments (`argv.sandbox`) or settings (`settings.sandbox`).
    *   Determines the appropriate sandbox command (`docker`, `podman`, `sandbox-exec`) based on system capabilities and user preferences.
    *   Retrieves the sandbox image URI from CLI arguments (`argv.sandboxImage`), environment variables (`GEMINI_SANDBOX_IMAGE`), or `package.json`.
    *   Returns a `SandboxConfig` object if both a command and an image are found.
