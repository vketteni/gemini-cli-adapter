# Analysis of `packages/cli/src/utils/startupWarnings.ts`

This file handles the reading and clearing of startup warning messages stored in a temporary file.

## Core Module Interactions

*   **`getErrorMessage`**: This function is imported from `@google/gemini-cli-core`. It is used to retrieve a user-friendly error message from an unknown error object. This suggests that the core module provides a standardized way to handle and present errors across the CLI.
