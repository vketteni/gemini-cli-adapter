# AI CLI Adapter

Open CLI frontend interface for gemini-cli.

## 🚀 Features

- **Universal Interface**: Single CLI that works with multiple AI providers
- **Pluggable Adapters**: Easy to add support for new AI services
- **Rich Terminal UI**: Beautiful, interactive command-line interface
- **Tool Integration**: Execute tools and commands through AI assistants
- **Open Source**: MIT licensed, community-driven development

## 📦 Installation

```bash
npm install -g ai-cli
```

## 🎯 Quick Start

```bash
# Start a chat session
ai-cli chat

# List available adapters
ai-cli list-adapters

# Use specific adapter
ai-cli chat --adapter google
```

## 🔌 Supported Adapters

- **Google Gemini** - Google's latest AI model
- More adapters coming soon!

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/vketteni/gemini-cli-adapter.git
cd gemini-cli-adapter

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development
npm run dev
```

## 📖 Documentation

- [Getting Started](./docs/guides/getting-started.md)
- [Creating Adapters](./docs/guides/creating-adapters.md)
- [API Reference](./docs/api/README.md)
- [Contributing](./CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Google's Gemini CLI
- Built with [Ink](https://github.com/vadimdemedes/ink) for terminal UI
- Community-driven development
