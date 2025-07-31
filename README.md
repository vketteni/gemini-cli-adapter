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

## Implementation Status

**Current Progress: Phase 3D Complete (Utility/Service Layer fully decoupled)**

### ✅ **Phase 1: CoreAdapter Interface Definition** 
**Status: COMPLETE**
- ✅ Interface defined with 6 service domains: `ChatService`, `ToolingService`, `WorkspaceService`, `AuthService`, `MemoryService`, `SettingsService`
- ✅ Comprehensive method signatures covering all CLI needs
- **Location:** `packages/core-interface/src/adapter.ts`

### ✅ **Phase 2: GoogleAdapter Implementation**
**Status: COMPLETE**
- ✅ All 6 services fully implemented with proper core module wrapping
- ✅ ChatService wraps GeminiClient/GeminiChat methods
- ✅ ToolingService wraps ToolRegistry and executeToolCall 
- ✅ WorkspaceService wraps FileDiscoveryService and workspace utilities
- ✅ AuthService wraps authentication and credential management
- ✅ MemoryService wraps hierarchical memory loading and management
- ✅ SettingsService wraps Config getters/setters with enum mapping
- **Location:** `packages/gemini-cli-core-shim/src/google-adapter.ts`

### ✅ **Phase 3: CLI Refactoring** 
**Status: Phase 3D COMPLETE - Utility/Service layer successfully decoupled from Config**

#### ✅ **Phase 3A: Entry Point Refactoring (COMPLETE)**
- ✅ Created `AdapterFactory` bridge between Config and CoreAdapter
- ✅ Refactored `gemini.tsx` main entry to create and pass CoreAdapter
- ✅ Refactored `nonInteractiveCli.ts` to accept CoreAdapter instead of Config
- ✅ Updated `App.tsx` component to accept adapter prop 
- ✅ Modified `useGeminiStream.ts` to accept CoreAdapter (with legacy Config support)
- **Location:** Entry point integration complete across main CLI flows

#### ✅ **Phase 3B: Critical Hook Layer (COMPLETE)**
- ✅ Refactored `useReactToolScheduler.ts` to use ToolingService from adapter
- ✅ Refactored `useLogger.ts` and `useAuthCommand.ts` hooks to use adapter services
- ✅ Updated hook call sites in `App.tsx` and `useGeminiStream.ts`
- ✅ Extended CoreAdapter interface with missing methods (getToolRegistry, isBrowserLaunchSuppressed, createLogger, etc.)
- ✅ Updated GoogleAdapter implementation with new interface methods
- ✅ Updated hook unit tests to mock CoreAdapter instead of Config
- **Target:** Remove direct `CoreToolScheduler`, telemetry, and auth dependencies ✅

#### ✅ **Phase 3C: Command Layer (COMPLETE)**
- ✅ Refactored `slashCommandProcessor` hook to accept CoreAdapter parameter
- ✅ Updated `CommandContext` interface to use CoreAdapter instead of Config
- ✅ Migrated all command service loaders (BuiltinCommandLoader, FileCommandLoader, McpPromptLoader)
- ✅ Updated 8+ individual slash commands to use adapter services:
  - `/memory` → MemoryService, `/tools` → ToolingService, `/clear` → ChatService
  - `/compress` → ChatService, `/about` → SettingsService, `/copy` → ChatService
  - `/chat` → WorkspaceService, plus extensions and init commands
- ✅ Updated App.tsx hook call site to pass adapter instead of config
- ✅ Enhanced CoreAdapter interface with compression metadata and memory file count methods
- **Target:** Remove direct tool registry and execution dependencies ✅

#### ✅ **Phase 3D: Utility/Service Layer (COMPLETE)**  
- ✅ Extended CoreAdapter interface with 8+ new methods for auth validation, sandbox config, file discovery, shell execution
- ✅ Updated GoogleAdapter with comprehensive new interface implementations
- ✅ Migrated `config/auth.ts` to use adapter-based authentication validation
- ✅ Migrated `validateNonInterActiveAuth.ts` to accept CoreAdapter parameter
- ✅ Migrated `utils/sandbox.ts` from SandboxConfig to adapter.settings.getSandboxConfig()
- ✅ Migrated `atCommandProcessor.ts` to use adapter.workspace and adapter.tools services
- ✅ Migrated `shellCommandProcessor.ts` to use adapter.tools.getShellExecutionService()
- ✅ Migrated `usePrivacySettings.ts` to use adapter.auth.getCodeAssistServer()
- ✅ Migrated `PrivacyNotice.tsx` and `InputPrompt.tsx` to use adapter services
- **Target:** Remove remaining Config object service location patterns ✅

#### ⏸️ **Phase 3E: Integration & Testing (PENDING)**
- Update all 64+ test files to mock CoreAdapter instead of Config
- End-to-end functionality validation
- Performance benchmarking vs original implementation
- **Target:** Complete removal of direct `@google/gemini-cli-core` imports

### ⏸️ **Phase 4: Alternative Adapter Validation**
**Status: READY** - Phase 3D completion enables multi-provider architecture

## Current Status & Roadmap

**Current Progress: Phase 3D Complete - Utility/Service layer fully decoupled from Config service locator**

### 🎯 **Immediate Next Steps (Phase 3E - Integration & Testing)**

**Week 5-6 Priorities:**
1. **Test Suite Migration** - Update 64+ test files to mock CoreAdapter instead of Config objects
2. **Call Site Updates** - Ensure all component instantiations pass adapter instead of config
3. **End-to-end Validation** - Comprehensive functionality testing of decoupled architecture

### 📋 **Medium-term Roadmap (Phase 3E-4)**

**Week 5-6: Integration & Testing (Phase 3E)**
- **Test Suite Migration** - Update 64+ test files to mock CoreAdapter instead of Config
- **Integration Testing** - End-to-end functionality validation of decoupled architecture
- **Performance Benchmarking** - Ensure no regression vs original implementation
- **Documentation** - Update architectural guides and developer documentation

**Week 6-7: Alternative Adapter Validation (Phase 4)**
- **Mock Adapter Creation** - Develop test adapter implementing CoreAdapter interface  
- **Multi-provider Testing** - Validate CLI works with non-Google backend
- **Developer Guide** - Document adapter implementation guide for third-party developers

### 🏗️ **Architecture Transition Strategy**

**Current State (Phase 3D Complete):**
```
CLI Entry Points → CoreAdapter → GoogleAdapter → @google/gemini-cli-core
Critical Hooks → CoreAdapter → GoogleAdapter → @google/gemini-cli-core  
Command Layer → CoreAdapter → GoogleAdapter → @google/gemini-cli-core
Utility/Service Layer → CoreAdapter → GoogleAdapter → @google/gemini-cli-core
```

**Target State (Phase 3E Complete):**
```
CLI Frontend → CoreAdapter Interface → [GoogleAdapter|OpenAIAdapter|AnthropicAdapter]
```

**Key Technical Challenges Accomplished:**
- ✅ **Entry Point Decoupling**: All CLI entry points now instantiate and pass CoreAdapter
- ✅ **Critical Hook Layer**: Successfully migrated `useReactToolScheduler`, `useLogger`, and `useAuthCommand` to use CoreAdapter services
- ✅ **Tool Execution**: Critical hooks now route through ToolingService instead of direct `CoreToolScheduler`
- ✅ **State Management**: Maintained React state consistency during hook refactor
- ✅ **Command Layer Migration**: All slash commands now route through CoreAdapter services
- ✅ **Service Dependency Injection**: Command loaders and processors use CoreAdapter instead of Config
- ✅ **Interface Evolution**: Enhanced CoreAdapter with compression metadata and memory management methods
- ✅ **Utility Layer Migration**: Migrated authentication utilities, sandbox config, command processors to use adapter services
- ✅ **Component Layer Decoupling**: Privacy notices, input components now use adapter instead of Config
- ✅ **Service Location Elimination**: Replaced Config service locator pattern with proper dependency injection

**Key Technical Challenges Remaining:**
- **Test Suite Migration**: Update 64+ test files to mock CoreAdapter instead of Config objects
- **Performance Validation**: Ensure no regression vs original implementation
- **Documentation Updates**: Comprehensive architectural guides for the new adapter pattern

### 🚀 **Phase 4: Extensibility Validation**

**Success Criteria for Alternative Adapter Support:**
- Create mock/test adapter implementing CoreAdapter interface
- Demonstrate CLI works with non-Google backend
- Validate clean separation of concerns
- Document adapter implementation guide for third-party developers

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
All contributors are expected to adhere to our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

This project is licensed under the [LICENSE](LICENSE) file.
