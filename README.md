<div align="center">

# 🌐 Open CLI

**The Community-Driven Agentic CLI Platform**

*Breaking the chains of vendor lock-in • Building the future of AI tooling together*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![Contributors](https://img.shields.io/github/contributors/vketteni/open-cli?style=for-the-badge)](https://github.com/vketteni/open-cli/graphs/contributors)

![Open CLI Demo](demo1.png)

### 🤝 [**Join the Movement**](#-join-the-movement) • 🔌 [**Build an Adapter**](#-build-your-adapter) • 🚀 [**Get Started**](#-quick-start)

</div>

---

## 📋 **Table of Contents**

- [🔌 Build Your Adapter](#-build-your-adapter)
- [⚡ Quick Start](#-quick-start)
- [🗺️ Community Roadmap](#️-community-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🔥 **The Problem We're Solving**

The agentic CLI landscape is **fragmented and closed**. Developers are forced to:

- 🔒 **Get locked into single providers** (OpenAI CLI, Claude CLI, Gemini CLI...)
- 🧩 **Learn different interfaces** for each agentic tool
- 💸 **Lose investment** when switching providers
- 🚫 **Can't customize** the core experience
- 🏗️ **Rebuild everything** for new agentic integrations

**What if there was a better way?**

## ✨ **The Open CLI Solution**

Open CLI is the **first truly decentralized agentic CLI platform** that breaks vendor lock-in forever.

> 🎯 **One interface. Any AI. Infinite possibilities.**

Built on the battle-tested foundation of Google's Gemini CLI, we've **decoupled the CLI frontend from agentic cores** through a clean `CLIProvider` interface. This means:

- ✅ **Freedom to choose** your AI provider
- ✅ **Consistent experience** across all models  
- ✅ **Community-driven innovation** in both UI and AI cores
- ✅ **Production-ready** from day one
- ✅ **Your contributions** shape the future of agentic tooling

```
🌍 Community CLI Frontend ↔ 🔌 Your Adapter ↔ 🤖 Any Agentic Core
```

---

## 🚀 **Join the Movement**

### 🎯 **Why This Matters**

Open CLI isn't just another CLI tool—it's a **movement toward decentralized agentic tooling**. We believe:

- **Developers deserve choice**, not vendor lock-in
- **Innovation thrives** in open, collaborative environments  
- **The best tools** emerge from diverse community contributions
- **Agentic CLI experiences** should be as unique as the teams using them

### 🤝 **How You Can Contribute**

| 🎨 **Frontend Developers** | 🧠 **Agentic Engineers** | 📚 **Technical Writers** |
|---|---|---|
| Enhance the CLI experience with new themes, commands, and UI components | Build adapters for Claude, OpenAI, local models, or your custom agentic cores | Create guides, tutorials, and documentation that help others join the ecosystem |

| 🔧 **DevTools Builders** | 🌟 **Community Leaders** | 💡 **Visionaries** |
|---|---|---|
| Integrate with IDEs, add new tool capabilities, improve performance | Help grow the community, organize events, mentor newcomers | Share ideas for the future of agentic CLI tooling and help guide our roadmap |

### 🎉 **Recognition**

Every contributor gets:
- 🏆 **Recognition** in our README and release notes
- 🎯 **Direct impact** on the future of agentic CLI tooling
- 🌟 **Showcase** for your adapter/contribution in our ecosystem
- 🤝 **Community** of like-minded builders and innovators

---

## 🔌 **Build Your Adapter**

### 🎯 **The 15-Minute Adapter Challenge**

Think you can't build an agentic adapter? **Think again.** Our `CLIProvider` interface makes it surprisingly simple:

```typescript
import { CLIProvider } from '@open-cli/interface';

export class YourAdapter implements CLIProvider {
  readonly id = 'your-ai-provider';
  readonly name = 'Your AI Provider';
  readonly version = '1.0.0';
  
  // Just implement these methods:
  async chat(message: string): Promise<string> { /* Your agentic magic here */ }
  async configure(): Promise<void> { /* Setup your agentic connection */ }
  // ... a few more simple methods
}
```

### 🛠️ **Adapter Ideas We'd Love to See**

- 🤖 **OpenAI Adapter** - GPT-4, GPT-3.5 support
- 🧠 **Claude Adapter** - Anthropic's Claude integration
- 🏠 **Local Model Adapter** - Ollama, LLaMA, etc.
- ⚡ **Multi-Provider Adapter** - Route to best model for each task
- 🎨 **Custom Agentic Cores** - Your proprietary agentic systems
- 🔗 **API Gateway Adapter** - Enterprise agentic infrastructure

### 📋 **Adapter Development Process**

1. 🍴 **Fork** the repository
2. 📁 **Create** `packages/your-adapter`
3. 🔨 **Implement** the `CLIProvider` interface
4. ✅ **Test** with our comprehensive test suite // TODO: Needs migration/implementation 
5. 📖 **Document** your adapter's capabilities
6. 🚀 **Submit** a pull request

**Need help?** Check our [Adapter Development Guide](docs/adapters/creating-adapters.md) or ask in [GitHub Discussions](https://github.com/vketteni/open-cli/discussions).

---

## 🌟 **Current Ecosystem**

### 🎯 **Production-Ready Adapters**

| Adapter | Status | Capabilities | Maintainer |
|---------|---------|-------------|------------|
| **GoogleAdapter** | ✅ Production | Full Gemini API support, streaming, tools | [@vketteni](https://github.com/vketteni) |

### 🚧 **Coming Soon**

- 🤖 **OpenAI Adapter** - *Looking for maintainer!*
- 🧠 **Claude Adapter** - *In development*
- 🏠 **Ollama Adapter** - *Community requested*

**Want to maintain an adapter?** [Let us know!](https://github.com/vketteni/open-cli/discussions/new?category=adapters)

---

## ⚡ **Quick Start**

### 🚀 **For Users // TODO: Still needs npm release** 

```bash
# Install Open CLI
npm install -g @open-cli/open-cli

# Start with Google's Gemini (default)
open-cli auth

# Begin your agentic CLI journey
open-cli "Help me set up a new TypeScript project"
```

### 👩‍💻 **For Developers**

```bash
# Clone and set up the development environment
git clone https://github.com/vketteni/open-cli.git
cd open-cli
npm install
npm run build

# Start developing
npm run dev
```

---

## 🏗️ **Architecture Deep Dive**

<details>
<summary>🔍 <strong>Click to explore the modular architecture that makes Open CLI possible</strong></summary>

<br>

Open CLI's power comes from its **modular, decoupled architecture**:

```
┌─────────────────────────────────────┐
│          CLI Frontend               │
│   (React + Ink Terminal UI)        │
├─────────────────────────────────────┤
│         CLIProvider Interface       │
│    (Clean, Typed Adapter Contract)  │
├─────────────────────────────────────┤
│              Adapters               │
│  GoogleAdapter │ YourAdapter │ ...  │
├─────────────────────────────────────┤
│           Agentic Cores             │
│  Gemini CLI   │  Your Agent │ ...   │
└─────────────────────────────────────┘
```

### 🎯 **Key Design Principles**

- **🔌 Pluggable**: Any agentic core can integrate via the `CLIProvider` interface
- **🛡️ Type-Safe**: Full TypeScript support across all packages
- **⚡ Performance**: Zero overhead abstraction - same performance as native implementations
- **🧪 Testable**: Comprehensive test suite with mock providers
- **📦 Modular**: Each package serves a specific, well-defined purpose

### 🔄 **How It Works**

1. **CLI Frontend** provides the rich terminal experience (themes, commands, UI)
2. **CLIProvider Interface** defines the contract all adapters must implement
3. **Adapters** translate between the interface and specific agentic cores
4. **Agentic Cores** handle the actual AI/ML processing and tool execution

This separation means you can:
- ✅ **Swap adapters** without changing the CLI experience
- ✅ **Extend the interface** for new capabilities
- ✅ **Test everything** in isolation
- ✅ **Contribute** to any layer independently

</details>

---

## 🗺️ **Community Roadmap**

### 🎯 **Phase 1: Foundation** (Current)
- ✅ Modular architecture with `CLIProvider` interface
- ✅ Production-ready Google Gemini adapter
- ✅ Comprehensive CLI frontend extracted from Gemini CLI
- 🔄 Community building and contributor onboarding

### 🚀 **Phase 2: Ecosystem Growth** (Next 3 months)
- 🎯 OpenAI and Claude adapters
- 🎯 Local model support (Ollama, LLaMA)
- 🎯 Plugin system for CLI commands
- 🎯 IDE integrations (VS Code, JetBrains)

### 🌟 **Phase 3: Innovation** (6+ months)
- 🎯 Multi-provider routing and load balancing
- 🎯 Advanced tool integrations
- 🎯 Enterprise features and governance
- 🎯 Community-driven feature development

**Have ideas?** [Share them in our roadmap discussions!](https://github.com/vketteni/open-cli/discussions/categories/roadmap)

---

## 📁 **Project Structure**

```
open-cli/
├── packages/
│   ├── interface/          # 🎯 CLIProvider interface definitions
│   ├── open-cli/          # 🖥️  Main CLI frontend (React + Ink)
│   └── gemini-adapter/    # 🤖 Google Gemini adapter implementation
├── apps/
│   └── open-cli/          # 📦 CLI application entry point
├── docs/                  # 📚 Documentation and guides
└── scripts/               # 🛠️  Build and utility scripts
```

### 🎯 **Package Details**

- **`@open-cli/interface`**: Core interface definitions (zero dependencies)
- **`@open-cli/cli`**: Rich terminal UI with React + Ink (production-ready)
- **`@open-cli/gemini-adapter`**: Reference implementation wrapping `@google/gemini-cli-core`
- **`@open-cli/open-cli`**: CLI application with binary distribution

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

Thanks to these amazing people who are building the future of agentic CLI tooling:

<!-- Contributors will be auto-generated -->

---

## 📄 **License**

Open CLI is released under the [Apache 2.0 License](LICENSE) - the same license as the original Gemini CLI. We believe in **open, permissive licensing** that encourages innovation and adoption while providing patent protection for contributors and users.

---

<div align="center">

## 🌟 **Ready to Shape the Future of Agentic CLI?**

### The future starts with **your** contribution

[![Join the Community](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github)](https://github.com/vketteni/open-cli/discussions)
[![Build an Adapter](https://img.shields.io/badge/Build-Adapter-FF6B6B?style=for-the-badge&logo=pluggy)](docs/adapters/creating-adapters.md)
[![Star the Project](https://img.shields.io/github/stars/vketteni/open-cli?style=for-the-badge&logo=starship&color=yellow)](https://github.com/vketteni/open-cli)

**Together, we're building the agentic CLI platform the community deserves.**

</div>
