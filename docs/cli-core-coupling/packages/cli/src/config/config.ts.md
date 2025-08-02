**File:** `packages/cli/src/config/config.ts`

**Imports from `@google/gemini-cli-core`:**
- `Config`, `loadServerHierarchicalMemory`, `setGeminiMdFilename`, `getCurrentGeminiMdFilename`, `ApprovalMode`, `DEFAULT_GEMINI_MODEL`, `DEFAULT_GEMINI_EMBEDDING_MODEL`, `DEFAULT_MEMORY_FILE_FILTERING_OPTIONS`, `FileDiscoveryService`, `TelemetryTarget`, `FileFilteringOptions`, `IdeClient`

**Usage Patterns:**
1.  **Argument Parsing (`parseArguments` function):**
    *   Uses `DEFAULT_GEMINI_MODEL` to set the default model.
    *   Defines various CLI options that influence the `Config` object.

2.  **Hierarchical Memory Loading (`loadHierarchicalGeminiMemory` function):**
    *   `loadServerHierarchicalMemory`: Delegates to the core module to load hierarchical memory.
    *   `FileDiscoveryService`: Used to create a file discovery service instance.
    *   `DEFAULT_MEMORY_FILE_FILTERING_OPTIONS`: Used as a base for file filtering options.

3.  **CLI Configuration Loading (`loadCliConfig` function):**
    *   `Config`: Instantiates the main `Config` object.
    *   `IdeClient`: Used to create an IDE client if `ideMode` is enabled.
    *   `setGeminiMdFilename`, `getCurrentGeminiMdFilename`: Used to manage the GEMINI.md filename.
    *   `ApprovalMode.YOLO`, `ApprovalMode.DEFAULT`: Used to set the approval mode based on CLI arguments.
    *   `DEFAULT_GEMINI_EMBEDDING_MODEL`: Sets the default embedding model.
    *   `TelemetryTarget`: Used for telemetry configuration.
    *   `FileFilteringOptions`: Used to configure file filtering.
    *   `FileDiscoveryService`: Used to create a file discovery service instance.
