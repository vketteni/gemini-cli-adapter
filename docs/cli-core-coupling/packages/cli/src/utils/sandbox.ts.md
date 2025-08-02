# Analysis of `packages/cli/src/utils/sandbox.ts`

This file provides functions for managing and interacting with a sandboxed environment, primarily using Docker or Podman.

## Core Module Interactions

*   **`SandboxConfig`**: This type is imported from `@google/gemini-cli-core`. The `start_sandbox` function receives an object of this type as its first argument (`config: SandboxConfig`). This indicates that the core module defines the structure and parameters for configuring the sandbox environment, including the command to use (e.g., 'docker', 'podman') and the sandbox image.

The `SandboxConfig` object dictates how the sandbox is launched and managed, making it a key point of interaction between the CLI's sandbox utility and the core module's configuration for sandboxing.
