# Analysis of `packages/cli/src/utils/installationInfo.ts`

This file provides utility functions to determine how the Gemini CLI is installed (e.g., globally via npm, locally, via Homebrew, etc.) and to generate appropriate update messages and commands.

## Core Module Interactions

*   **`isGitRepository`**: This function is imported from `@google/gemini-cli-core`. It is used to check if the current working directory (`process.cwd()`) is a Git repository. This information is then used to provide a specific update message for users running from a local Git clone.
