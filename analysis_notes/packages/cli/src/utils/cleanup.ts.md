# Analysis of `packages/cli/src/utils/cleanup.ts`

This file provides utility functions for cleaning up temporary files and registering cleanup actions to be run on exit.

## Core Module Interactions

*   **`getProjectTempDir`**: This function is imported from `@google/gemini-cli-core`. It is used within `cleanupCheckpoints` to retrieve the absolute path to the project's temporary directory. This indicates that the core module is responsible for defining and providing access to project-specific temporary storage locations.
