# Getting Started

Welcome to GEMINI CLI Adapter! This guide will help you get up and running quickly.

## Installation

```bash
npm install -g ai-cli
```

## Basic Usage

### Starting a Chat

```bash
ai-cli chat
```

This will start an interactive chat session using the default adapter (Google Gemini).

### Using Different Adapters

```bash
# Use Google Gemini
ai-cli chat --adapter google

# List available adapters
ai-cli list-adapters
```

## Configuration

Configuration files are stored in your home directory under `.ai-cli/`:

- `config.json` - Main configuration
- `adapters/` - Adapter-specific settings

### Example Configuration

```json
{
  "defaultAdapter": "google",
  "adapters": {
    "google": {
      "apiKey": "your-api-key-here",
      "model": "gemini-pro"
    }
  }
}
```

## Next Steps

- [Creating Custom Adapters](./creating-adapters.md)
- [Advanced Configuration](./configuration.md)
- [Tool Integration](./tools.md)
