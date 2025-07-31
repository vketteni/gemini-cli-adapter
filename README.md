# Gemini CLI Adapter

## Overview

This project aims to create a robust and flexible adapter for the Gemini CLI, designed to decouple the CLI frontend from its core module (`@google/gemini-cli-core`). The primary goal is to introduce a clean, generalized interface that allows for easy integration of alternative core modules (e.g., OpenAI, Anthropic) while maintaining backward compatibility with the existing CLI.

## Architecture

The core of this project revolves around a **CoreAdapter Interface** that acts as a translation layer between the CLI frontend and various core modules.

```
CLI-Frontend ↔ CoreAdapter Interface ↔ GoogleAdapter ↔ @google/gemini-cli-core
CLI-Frontend ↔ CoreAdapter Interface ↔ OpenAIAdapter ↔ OpenAI-Core-Module
CLI-Frontend ↔ CoreAdapter Interface ↔ AnthropicAdapter ↔ Anthropic-Core-Module
```

A **Hybrid Approach** is used, combining:
*   **Package Aliasing:** `@google/gemini-cli-core` is aliased to `gemini-cli-core-shim` to allow for internal redirection without modifying the CLI frontend's import statements.
*   **Translation Layer Pattern:** Adapters (like `GoogleAdapter`) translate between the `CoreAdapter` interface and the actual core modules, handling data format and interaction pattern impedance matching.

## Key Features & Goals

*   **Decoupling:** Sever the tight coupling between the CLI frontend and specific core implementations.
*   **Extensibility:** Enable seamless integration of diverse AI core modules.
*   **Backward Compatibility:** Ensure the existing CLI frontend continues to function without code changes.
*   **Clean Interface:** Provide a generalized, module-agnostic interface for core functionalities.

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

*   `packages/cli`: The main CLI frontend module.
*   `packages/core-interface`: Defines the `CoreAdapter` interface.
*   `packages/gemini-cli-core-shim`: The shim module used for package aliasing, which will eventually delegate to the `GoogleAdapter`.
*   `docs/`: Project documentation, including architectural guides.
*   `analysis_notes/`: Detailed analysis of the CLI's interaction with the original core module.

## Current Status & Roadmap

The project is currently in **Phase 1: End-to-End Analysis**. This phase focuses on comprehensively mapping all interactions between the CLI frontend and the `@google/gemini-cli-core` to inform the design of the `CoreAdapter` interface.

**Next Steps:**
*   **Phase 2: Google-Shim Expansion:** Expand the `gemini-cli-core-shim` to compile and work with the CLI frontend, using stub functions.
*   **Phase 3: GoogleAdapter as Translation Layer:** Implement the `GoogleAdapter` to bridge to the real `@google/gemini-cli-core` module.
*   **Phase 4: Alternative Adapter Validation:** Prove the architecture by creating a mock alternative adapter (e.g., OpenAI).

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
All contributors are expected to adhere to our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [LICENSE](LICENSE) file.
