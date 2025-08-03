<div align="center">

# 🚀 Open CLI

*The modular AI CLI that adapts to **your** intelligence*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)

![Open CLI Demo](demo1.png)

</div>

> **Tired of being locked into one AI provider?** Open CLI is the first **truly modular** AI CLI that lets you plug in **any** AI core while keeping the polished experience you love.

## Overview

Designed for builders of AI-powered core modules, an open-source CLI frontend that enables anyone to integrate their own agentic systems, tools, and AI providers while leveraging a proven, feature-rich CLI experience based on Google's Gemini CLI.

## Architecture

The project's architecture centers on a domain-driven **`CLIProvider` interface** that provides a clean, modern contract for integrating AI-powered agentic core modules with the CLI frontend.

The `GoogleAdapter` serves as the reference implementation, wrapping the original `@google/gemini-cli-core` to provide a `CLIProvider` interface.

```
CLI Frontend ↔ GoogleAdapter (CLIProvider) ↔ @google/gemini-cli-core
CLI Frontend ↔ CustomAdapter (CLIProvider) ↔ Your-AI-Core
```

## Key Features & Goals

*   **Decoupled Architecture:** Clean separation between CLI frontend and core module implementations
*   **Friendly Interface:** `CLIProvider` contract for integrating custom core modules
*   **Production-Ready:** Extracted from Google's Gemini CLI with full feature parity
*   **Extensible Design:** Support for diverse agentic systems, tools, and AI capabilities through unified interface

## Getting Started

To set up the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vketteni/open-cli.git
    cd open-cli
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

*   `packages/open-cli`: The main CLI frontend module, extracted and refactored from Gemini CLI
*   `packages/interface`: Defines the domain-driven `CLIProvider` interface for core module integration
*   `packages/gemini-adapter`: GoogleAdapter implementation providing `CLIProvider` interface for Google's Gemini CLI core
*   `apps/open-cli`: The CLI application entry point
*   `docs/`: Project documentation and architectural guides

**Key Features:**
- **🔧 Modular Design**: Clean separation between CLI frontend and agentic core implementations
- **🚛 GoogleAdapter**: Production-ready integration with Google's Gemini CLI core
- **📦 TypeScript**: Complete type safety across all packages
- **⚡ Performance**: No regression from original Gemini CLI implementation

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
All contributors are expected to adhere to our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [LICENSE](LICENSE) file.
