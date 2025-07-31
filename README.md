# Gemini CLI Adapter

## Overview

This project aims to create a robust and flexible adapter for the Gemini CLI, designed to decouple the CLI frontend from its core module (`@google/gemini-cli-core`). The primary goal is to introduce a clean, generalized interface that allows for easy integration of alternative core modules (e.g., OpenAI, Anthropic) while maintaining backward compatibility with the existing CLI.

## Architecture

The project's architecture centers on a new, domain-driven **`CoreAdapter` interface**. This interface will act as a clean, modern, and intuitive contract for any backend AI service to integrate with the Gemini CLI.

The legacy `@google/gemini-cli-core` will be wrapped by a `GoogleAdapter`, which is the first and primary implementation of the `CoreAdapter` interface.

The CLI frontend itself will be **refactored** to interact directly with the new `CoreAdapter` interface, removing its legacy dependencies on the original core module's complex structure.

```
CLI-Frontend ↔ CoreAdapter Interface ↔ GoogleAdapter ↔ @google/gemini-cli-core
CLI-Frontend ↔ CoreAdapter Interface ↔ OpenAIAdapter ↔ OpenAI-Core-Module
```

This approach ensures that future "builders" of alternative adapters (like for OpenAI or Anthropic) have a simple and logical interface to implement, maximizing the project's extensibility.

## Key Features & Goals

*   **Decoupling:** Sever the tight coupling between the CLI frontend and specific core implementations.
*   **Extensibility:** Enable seamless integration of diverse AI core modules through a clean, builder-friendly interface.
*   **Maintainability:** Improve the long-term health of the CLI by refactoring it against a modern, domain-driven interface.
*   **Clean Interface:** Provide a generalized, module-agnostic interface for core functionalities like chat, tooling, and workspace management.

## Getting Started

To set up the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/gemini-cli-adapter.git
    cd gemini-cli-adapter
    ```
2.  **Install dependencies:**
    This project uses `npm` workspaces.
    ```bash
    npm install
    ```
3.  **Build the project:**
    ```bash
    npm run build
    ```
    (Further instructions on running specific parts of the project or tests would go here once implemented.)

## Project Structure

*   `packages/cli`: The main CLI frontend module, which will be refactored.
*   `packages/core-interface`: Defines the new, domain-driven `CoreAdapter` interface.
*   `packages/gemini-cli-core-shim`: A shim module that will facilitate the transition by initially housing the `GoogleAdapter`.
*   `docs/`: Project documentation, including architectural guides.
*   `analysis_notes/`: Detailed analysis of the CLI's interaction with the original core module.

## Current Status & Roadmap

The project has completed its initial analysis phase and has defined a clear architectural path forward.

**Next Steps:**

*   **Phase 1: Define `CoreAdapter` Interface:** Formalize the new, domain-driven `CoreAdapter` interface within `packages/core-interface`.
*   **Phase 2: Implement `GoogleAdapter`:** Create the `GoogleAdapter` which implements the new interface and acts as a translation layer to the original `@google/gemini-cli-core`.
*   **Phase 3: Incremental CLI Refactoring:** Systematically refactor the `packages/cli` frontend, file by file, to remove legacy calls and use the new `CoreAdapter` interface instead. This will be done with a full test suite to ensure no regressions.
*   **Phase 4: Alternative Adapter Validation:** Prove the architecture by creating a mock or partial alternative adapter (e.g., for OpenAI).

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
All contributors are expected to adhere to our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [LICENSE](LICENSE) file.
