<div align="center">

# 🌐 Open CLI

**Personal Experimental Agentic CLI**

*A coding companion built with OpenCode-inspired patterns • Currently under heavy development*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![Experimental](https://img.shields.io/badge/Status-Experimental-orange?style=for-the-badge)](https://github.com/vketteni/open-cli)

![Open CLI Demo](demo1.png)

### ⚠️ [**Current State**](#-current-state) • 🏗️ [**Architecture**](#-architecture) • 💻 [**Development**](#-development) • 🙏 [**Acknowledgments**](#-acknowledgments)

</div>

---


## ⚠️ **Current State**

This is my **personal experimental project** for exploring agentic CLI patterns. The project is currently:

> 🚧 **Under heavy architectural refactoring - expect things to be broken**

### 🔄 **What's Happening**
- **Major refactoring in progress** - Transitioning from Google Gemini CLI base to OpenCode-inspired architecture
- **TypeScript compilation errors** - Core integration is incomplete
- **UI components being rebuilt** - Moving from legacy patterns to clean discriminated unions
- **Experimental features** - Testing new approaches to agentic tool orchestration

### 🎯 **Project Vision**
Building a personal coding companion that combines:
- 🎨 **Rich Terminal UI** - React + Ink interface with themes and interactive components
- 🏗️ **OpenCode-Inspired Core** - Sophisticated tool orchestration and session management  
- 🤖 **Multi-AI Support** - Works with Claude, OpenAI, Google, and local models
- 🛠️ **Advanced Tooling** - File editing, shell execution, code analysis, and more

---

## 💻 **Development**

⚠️ **Note: Currently broken due to ongoing refactoring**

```bash
git clone https://github.com/vketteni/open-cli.git
cd open-cli
npm install
# npm run build  # Currently fails - refactoring in progress
```

### 🔧 **Development Status**
- **Package linking** - Workspace dependencies need fixing
- **TypeScript compilation** - Multiple type mismatches during Core integration  
- **UI components** - Legacy components being replaced with OpenCode patterns
- **Core integration** - New orchestrator patterns being integrated

### 🚀 **When Working**
The CLI will support:
- Multi-provider AI integration (Claude, OpenAI, Google)
- Advanced file editing with multi-strategy matching
- Interactive tool execution with permissions
- Rich terminal UI with themes and commands

---

## 🏗️ **Architecture**

The project is transitioning to a clean OpenCode-inspired architecture:

### 📁 **Project Structure**

```
open-cli/
├── packages/
│   ├── open-core/         # 🏗️ OpenCode-inspired orchestration engine
│   ├── open-cli/         # 🎨 CLI frontend with React + Ink (being refactored)
│   └── openai/           # 🤖 OpenAI provider (minimal implementation)
├── apps/
│   └── open-cli/         # 🚀 Binary application
└── scripts/              # ⚙️  Development utilities
```

### 🎯 **Core Components**

| Component | Status | Description | 
|-----------|---------|-------------|
| **open-core** | 🏗️ In Progress | OpenCode-inspired session orchestrator with tool registry |
| **Message Types** | ✅ Complete | Clean discriminated unions replacing legacy patterns |
| **Tool Registry** | ✅ Complete | 8 implemented tools (edit, read, write, bash, grep, etc.) |
| **CLI Frontend** | 🚧 Refactoring | UI components being rebuilt with new patterns |
| **Provider System** | 🧪 Experimental | Multi-AI support with Core integration |

### 🛠️ **Recent Progress**
- ✅ Implemented OpenCode-style discriminated unions
- ✅ Created clean MessageDisplay component  
- ✅ Built comprehensive tool registry with security patterns
- ✅ Added Zod schemas for runtime validation
- 🚧 Integrating Core with CLI frontend (in progress)
---

## 🎯 **Personal Learning Goals**

This experimental project helps me explore:
- **OpenCode architecture patterns** - Learning from excellent design decisions
- **Agentic tool orchestration** - Session management, streaming, and tool coordination
- **TypeScript at scale** - Complex type systems and discriminated unions
- **React + Ink patterns** - Building rich terminal interfaces
- **AI integration patterns** - Multi-provider support and tool execution

---

## 🙏 **Acknowledgments**

**Massive inspiration from [OpenCode](https://github.com/sst/opencode)** - This project learns heavily from their excellent agentic architecture patterns. The OpenCode team has built something truly remarkable, and their design decisions around tool orchestration, session management, and discriminated union patterns have been invaluable learning material.

**Built on Google Gemini CLI foundation** - The original CLI interface patterns and React + Ink components provided an excellent starting point, though the architecture has since evolved significantly.

---

## 📄 **License**

Apache 2.0 License - Open source for learning and experimentation.

---

<div align="center">

## 🧪 **Experimental Project**

### Personal coding companion - expect frequent changes

This is a **work-in-progress personal project**. The code serves as a learning playground for exploring agentic CLI patterns and may not be suitable for production use.

</div>
