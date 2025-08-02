**File:** `packages/cli/src/config/config.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `* as ServerConfig` (aliased from `@google/gemini-cli-core`)

**Usage Patterns:**
1.  **Mocking Core Modules:**
    *   `ServerConfig.IdeClient`: Mocked to simulate IDE client behavior.
    *   `ServerConfig.loadEnvironment`: Mocked.
    *   `ServerConfig.loadServerHierarchicalMemory`: Mocked to control memory loading behavior.
    *   `ServerConfig.DEFAULT_MEMORY_FILE_FILTERING_OPTIONS`: Used directly.
    *   `ServerConfig.DEFAULT_FILE_FILTERING_OPTIONS`: Used directly.
    *   `ServerConfig.DEFAULT_TELEMETRY_TARGET`: Used directly.

2.  **Testing `loadCliConfig` Function:**
    *   `ServerConfig.loadServerHierarchicalMemory` is expected to be called with specific arguments, including extension context file paths and file filtering options.
    *   Various `config.get...()` methods are used to assert that configuration values (e.g., `showMemoryUsage`, `proxy`, `telemetry` settings, `mcpServers`, `excludeTools`, `ideMode`) are correctly loaded and prioritized from CLI arguments, environment variables, and settings.
