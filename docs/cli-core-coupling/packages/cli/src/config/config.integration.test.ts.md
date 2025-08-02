**File:** `packages/cli/src/config/config.integration.test.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `ConfigParameters`, `ContentGeneratorConfig`

**Usage Patterns:**
1.  **Testing `Config` Class:**
    *   `new Config(configParams)`: Instantiates the `Config` class, passing various configuration parameters.
    *   `config.getFileFilteringRespectGitIgnore()`: Tests the retrieval of file filtering settings.
    *   `config.getCheckpointingEnabled()`: Tests the retrieval of checkpointing settings.
    *   `config.getExtensionContextFilePaths()`: Tests the retrieval of extension context file paths.

2.  **Mocking Core Modules:**
    *   `FileDiscoveryService`: Mocked to control its behavior during tests.
    *   `createToolRegistry`: Mocked to control its behavior during tests.
