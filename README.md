<div align="center">

# 🌐 Open CLI

**The Open Source Agentic CLI Platform**

*Reusable UI for agentic CLI tools • Service interfaces*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![Contributors](https://img.shields.io/github/contributors/vketteni/open-cli?style=for-the-badge)](https://github.com/vketteni/open-cli/graphs/contributors)

![Open CLI Demo](demo1.png)

### 🌟 [**Current State**](#-current-state) • 📁 [**Architecture**](#-project-architecture) • ⚡ [**Quick Start**](#-quick-start) • 🚀 [**Get Involved**](#-get-involved) • 🔌 [**Contribute**](#-contribute-to-the-foundation)

</div>

---

## 🔥 **The Challenge**

Building agentic CLI tools requires solving the same problems repeatedly:

- 🔄 **Reimplementing common patterns** (auth, streaming, tool execution, UI components)
- 🧩 **Integrating multiple services** (chat, tools, workspace, memory management)
- 🎨 **Building polished terminal interfaces** from scratch
- 🔗 **Managing complex state** across different agentic providers
- 🛠️ **Creating consistent user experiences** while supporting diverse backends

**Every new agentic CLI starts from zero, rebuilding proven patterns.**

## ✨ **The Open CLI Approach**

Open CLI provides **reusable infrastructure** for building agentic CLI tools.

> 🎯 **Solve the hard problems once. Build on proven foundations.**

We've extracted the CLI architecture from Google's Gemini CLI and created a clean `CLIProvider` interface that separates concerns:

- 🏗️ **Proven foundations** - Battle-tested CLI frontend with React + Ink
- 🔌 **Clean abstractions** - Well-defined service interfaces for common needs
- 🎨 **Rich components** - Terminal UI, themes, commands, and interaction patterns
- 🧪 **Testable architecture** - Mock implementations and comprehensive testing support
- 🔄 **Extensible design** - Add new capabilities without breaking existing integrations

```
🖥️ Rich CLI Frontend ↔ 🔌 Service Interface ↔ 🤖 Your Agentic System
```

Instead of building everything from scratch, implement the interface and get a polished CLI experience.

---

## 🌟 **Current State**

### 🎯 **What's Working Today**

| Component | Status | Description | 
|-----------|---------|-------------|
| **CLIProvider Interface** | ✅ Stable | Complete service interface with 6 core areas |
| **GoogleAdapter** | ✅ Working | Reference implementation wrapping Gemini CLI |
| **CLI Frontend** | ✅ Feature-rich | React + Ink interface with themes, commands, UI components |
| **Adapter Factory** | ✅ Ready | Registration system for multiple providers |

### 🚧 **Integration Opportunities**

These are areas where contributors could make immediate impact:

- 🤖 **OpenAI Integration** - Well-documented API, good first integration project
- 🧠 **Claude Integration** - Anthropic's API, similar patterns to Google adapter  
- 🏠 **Local Model Integration** - Ollama, LLaMA, etc. for offline usage
- 🔧 **Interface Improvements** - Better TypeScript definitions, validation helpers

**Interested in building an integration?** [Start a discussion!](https://github.com/vketteni/open-cli/discussions)

---

## 📁 **Project Architecture**

```
open-cli/
├── packages/
│   ├── interface/          # 🏗️ Service contracts and TypeScript definitions
│   ├── open-cli/          # 🎨 CLI frontend with React + Ink components
│   └── gemini-adapter/    # 🔌 Reference integration for Google's API
├── apps/
│   └── open-cli/          # 🚀 Binary application and build configuration
├── docs/                  # 📖 Integration guides and API documentation
└── scripts/               # ⚙️  Development and build automation
```

### 🎯 **Core Components**

- **`@open-cli/interface`**: Foundation layer - service contracts that define how agentic systems integrate
- **`@open-cli/open-cli`**: Frontend layer - rich terminal interface with themes, commands, and UI components  
- **`@open-cli/gemini-adapter`**: Integration layer - working example that implements the service contracts
- **`open-cli` binary**: Application layer - packaged CLI tool ready for distribution

---

## ⚡ **Quick Start**

```bash
git clone https://github.com/vketteni/open-cli.git
cd open-cli
npm install && npm run build && npm run dev
```

---

## 🚀 **Get Involved**

### 🎯 **Why Contribute**

Open CLI addresses real technical challenges that every agentic CLI builder faces:

- **Reduce duplication** - Stop rebuilding the same patterns repeatedly
- **Accelerate development** - Build on proven, tested foundations  
- **Share knowledge** - Learn from and improve established patterns
- **Shape infrastructure** - Help define how agentic CLI tools should work

### 🤝 **How You Can Contribute**

| 🏗️ **Interface Architects** | 🎨 **Frontend Engineers** | 🔌 **Integration Builders** |
|---|---|---|
| Improve the `CLIProvider` service definitions, add TypeScript documentation, create validation helpers | Enhance the React + Ink interface, add CLI themes, improve terminal components | Build integrations for OpenAI, Claude, local models, or custom agentic systems |

| 🧪 **Infrastructure Engineers** | 📚 **Documentation Writers** | 🛠️ **DevTools Contributors** |
|---|---|---|
| Add testing frameworks, improve build systems, enhance development tooling | Create integration guides, API documentation, and contributor onboarding materials | Add IDE integrations, debugging tools, or development utilities |

### 🎉 **Recognition**

Every contributor gets:
- 🏆 **Recognition** in our README and release notes
- 🎯 **Direct impact** on the project's direction and capabilities
- 🌟 **Showcase** for your contributions in the project
- 🤝 **Collaboration** with other contributors and maintainers

---

## 🔌 **Contribute to the Foundation**

### 🎯 **Multiple Ways to Contribute**

The project needs contributors across different areas - from improving the core interface to building new integrations:

**Option 1: Enhance the Core Interface**
Improve the `CLIProvider` contract, add new service capabilities, or strengthen the foundational architecture.

**Option 2: Build New Integrations** 
Implement the `CLIProvider` interface for different agentic systems:

```typescript
import { CLIProvider, ChatService, ToolingService, /* ... */ } from '@open-cli/interface';

export class YourAdapter implements CLIProvider {
  // Implement the six service interfaces:
  chat: ChatService;
  tools: ToolingService; 
  workspace: WorkspaceService;
  auth: AuthService;
  memory: MemoryService;
  settings: SettingsService;
  
  // Plus telemetry methods
  isTelemetryInitialized(): boolean { /* ... */ }
  shutdownTelemetry(): Promise<void> { /* ... */ }
}
```

**Option 3: Improve the CLI Frontend**
Enhance the React + Ink interface, add new commands, improve themes, or extend the UI components.

### 🛠️ **Integration Ideas We'd Love to See**

- 🤖 **OpenAI Integration** - GPT-4, GPT-3.5 support
- 🧠 **Claude Integration** - Anthropic's Claude models
- 🏠 **Local Model Integration** - Ollama, LLaMA, etc.
- 🎨 **Custom Agentic Systems** - Your proprietary tools
- 🔗 **Enterprise Integrations** - API gateways, corporate AI systems

### 🚀 **Good First Contributions**

<details>
<summary><b>🏗️ Interface/Architecture</b> - Strengthen the foundation</summary>

- **📝 Add method documentation** to the `CLIProvider` service interfaces
- **🧪 Create mock implementations** for testing the interface design  
- **🛡️ Improve TypeScript types** to make the interface more robust
- **✅ Add validation helpers** for service implementations

</details>

<details>
<summary><b>🔌 Integration Building</b> - Connect new systems</summary>

- **🏠 Create a minimal adapter** for a local LLM (great learning project)
- **🤖 Add OpenAI ChatService implementation** (well-documented API)
- **🔐 Build configuration helpers** for new authentication methods

</details>

<details>
<summary><b>🎨 Frontend Enhancement</b> - Improve the user experience</summary>

- **🎨 Add new CLI themes** to the existing theme system
- **📖 Improve command documentation** and help text
- **🧩 Create new UI components** for displaying different data types
- **♿ Enhance accessibility** in the terminal interface

</details>

**Need help?** Check our [contributing guide](CONTRIBUTING.md) or ask in [GitHub Discussions](https://github.com/vketteni/open-cli/discussions).

---

## 🗺️ **Development Roadmap**

### 🎯 **Phase 1: Foundation** (Current)
- ✅ Modular architecture with `CLIProvider` interface
- ✅ Production-ready Google Gemini adapter
- ✅ Comprehensive CLI frontend extracted from Gemini CLI
- 🔄 Community building and contributor onboarding (ongoing)

### 🚀 **Phase 2: Ecosystem Growth** (Timeline depends on community involvement)
- 🎯 OpenAI and Claude adapters
- 🎯 Local model support (Ollama, LLaMA)
- 🎯 Plugin system for CLI commands
- 🎯 IDE integrations (VS Code, JetBrains)

### 🌟 **Phase 3: Innovation** (Long-term goals)
- 🎯 Multi-provider routing and load balancing
- 🎯 Advanced tool integrations
- 🎯 Enterprise features and governance
- 🎯 Community-driven feature development

**Have ideas?** [Share them in our roadmap discussions!](https://github.com/vketteni/open-cli/discussions/categories/roadmap)

---

## 🤝 **Contributing**

We welcome contributions of all kinds! Whether you're:

- 🐛 **Reporting bugs** or requesting features
- 💻 **Writing code** for new adapters or CLI enhancements  
- 📖 **Improving documentation** and guides
- 🎨 **Designing** better user experiences
- 🗣️ **Spreading the word** about Open CLI

**Every contribution matters!**

### 📋 **Getting Started**

1. 📖 Read our [Contributing Guide](CONTRIBUTING.md)
2. 👀 Check our [Code of Conduct](CODE_OF_CONDUCT.md)
3. 🍴 Fork the repository
4. 💬 Join our [GitHub Discussions](https://github.com/vketteni/open-cli/discussions)

### 🏆 **Current Contributors**

Thanks to these amazing people who are helping build better agentic CLI experiences:

<!-- Contributors will be auto-generated -->

---

## 📄 **License**

Open CLI is released under the [Apache 2.0 License](LICENSE) - the same license as the original Gemini CLI. We believe in **open, permissive licensing** that encourages innovation and adoption while providing patent protection for contributors and users.

---

<div align="center">

## 🚀 **Ready to Contribute?**

### Help us build better agentic CLI infrastructure

[![Join the Community](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github)](https://github.com/vketteni/open-cli/discussions)
[![Build Integration](https://img.shields.io/badge/Build-Integration-FF6B6B?style=for-the-badge&logo=pluggy)](docs/adapters/creating-adapters.md)
[![Star the Project](https://img.shields.io/github/stars/vketteni/open-cli?style=for-the-badge&logo=starship&color=yellow)](https://github.com/vketteni/open-cli)

**Join us in building better foundational tools for agentic CLI development.**

</div>
