# Gemini CLI Adapter

This project provides a modular, open-source version of Google's Gemini CLI. The primary goal is to refactor the original tool, separating the command-line interface (frontend) from the core AI logic (backend) by introducing a clean adapter interface.

This allows developers to:
- Understand and build upon the Gemini CLI's architecture.
- Easily connect their own custom AI backends to a polished UI by writing a simple adapter, saving them from the effort of building a CLI from scratch.
- Reuse the frontend or core interface in their own projects.

## 📦 Installation

To install the demonstration CLI:

```bash
npm install -g @gemini-cli-adapter/gemini-cli
```

## 🎯 Quick Start

```bash
# Start a chat session using the Google adapter
demo-cli chat

# The command structure remains similar to the original Gemini CLI
demo-cli --help
```



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
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to help with the refactoring effort.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
