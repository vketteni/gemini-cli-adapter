#!/bin/bash

# GEMINI CLI Adapter Project Setup Script
# This script creates a complete project structure for the GEMINI CLI Adapter

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="gemini-cli-adapter"
GITHUB_USERNAME=""
PROJECT_DESCRIPTION="Universal CLI frontend for AI language models with pluggable adapters"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get user input
get_user_input() {
    print_status "Setting up GEMINI CLI Adapter project..."
    
    read -p "Enter your GitHub username (optional): " GITHUB_USERNAME
    read -p "Enter project name [gemini-cli-adapter]: " input_name
    PROJECT_NAME=${input_name:-$PROJECT_NAME}
    
    read -p "Enter project description: " input_desc
    if [[ -n "$input_desc" ]]; then
        PROJECT_DESCRIPTION="$input_desc"
    fi
}

# Create directory structure
create_directory_structure() {
    print_status "Creating directory structure..."
    
    mkdir -p "$PROJECT_NAME"
    cd "$PROJECT_NAME"
    
    # Main directories
    mkdir -p packages/{core-interface,cli-frontend,google-adapter,shared-types}
    mkdir -p apps/{cli,examples}
    mkdir -p tools/{scripts,testing}
    mkdir -p docs/{api,guides,contributing}
    mkdir -p .github/{workflows,ISSUE_TEMPLATE,PULL_REQUEST_TEMPLATE}
    
    print_success "Directory structure created"
}

# Generate root package.json
create_root_package_json() {
    print_status "Creating root package.json..."
    
    cat > package.json << EOF
{
  "name": "$PROJECT_NAME",
  "version": "0.1.0",
  "description": "$PROJECT_DESCRIPTION",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "typecheck": "npm run typecheck --workspaces",
    "clean": "npm run clean --workspaces && rm -rf node_modules",
    "dev": "npm run dev -w apps/cli"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.2.5",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"
  },
  "license": "MIT"
}
EOF
    
    print_success "Root package.json created"
}

# Create TypeScript configuration
create_typescript_config() {
    print_status "Creating TypeScript configuration..."
    
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@gemini-cli-adapter/core-interface": ["./packages/core-interface/src"],
      "@gemini-cli-adapter/cli-frontend": ["./packages/cli-frontend/src"],
      "@gemini-cli-adapter/google-adapter": ["./packages/google-adapter/src"],
      "@gemini-cli-adapter/shared-types": ["./packages/shared-types/src"]
    }
  },
  "include": ["packages/*/src/**/*", "apps/*/src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF

    print_success "TypeScript configuration created"
}

# Create ESLint configuration
create_eslint_config() {
    print_status "Creating ESLint configuration..."
    
    cat > .eslintrc.js << 'EOF'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
EOF

    print_success "ESLint configuration created"
}

# Create Prettier configuration
create_prettier_config() {
    print_status "Creating Prettier configuration..."
    
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

    cat > .prettierignore << 'EOF'
node_modules/
dist/
coverage/
*.md
EOF

    print_success "Prettier configuration created"
}

# Create core interface package
create_core_interface_package() {
    print_status "Creating core interface package..."
    
    cd packages/core-interface
    
    cat > package.json << EOF
{
  "name": "@gemini-cli-adapter/core-interface",
  "version": "0.1.0",
  "description": "Core interface definitions for GEMINI CLI adapters",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  }
}
EOF

    mkdir -p src
    cat > src/index.ts << 'EOF'
/**
 * Core interface definitions for GEMINI CLI adapters
 */

export * from './types/adapter.js';
export * from './types/chat.js';
export * from './types/tools.js';
export * from './types/config.js';
EOF

    mkdir -p src/types
    cat > src/types/adapter.ts << 'EOF'
/**
 * Core adapter interface that all AI providers must implement
 */

import { ChatConfig, ChatEvent } from './chat.js';
import { ToolMetadata, ToolRequest, ToolEvent } from './tools.js';
import { AdapterConfig, ValidationResult } from './config.js';

export interface CoreAdapter {
  /**
   * Unique identifier for this adapter
   */
  readonly id: string;
  
  /**
   * Human-readable name for this adapter
   */
  readonly name: string;
  
  /**
   * Version of the adapter
   */
  readonly version: string;
  
  /**
   * Create a new chat session
   */
  createSession(config: ChatConfig): Promise<string>;
  
  /**
   * Send a message and receive streaming response
   */
  sendMessage(sessionId: string, message: string): AsyncIterable<ChatEvent>;
  
  /**
   * Get available tools for this adapter
   */
  getAvailableTools(): Promise<ToolMetadata[]>;
  
  /**
   * Execute tools with streaming updates
   */
  executeTools(requests: ToolRequest[]): AsyncIterable<ToolEvent>;
  
  /**
   * Validate adapter configuration
   */
  validateConfig(config: AdapterConfig): Promise<ValidationResult>;
  
  /**
   * Initialize the adapter
   */
  initialize(): Promise<void>;
  
  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}
EOF

    cat > src/types/chat.ts << 'EOF'
/**
 * Chat-related type definitions
 */

export interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatEvent {
  type: 'content' | 'thinking' | 'error' | 'done';
  data: unknown;
  timestamp: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
EOF

    cat > src/types/tools.ts << 'EOF'
/**
 * Tool system type definitions
 */

export interface ToolMetadata {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  category?: string;
}

export interface ToolRequest {
  toolName: string;
  parameters: Record<string, unknown>;
  requestId: string;
}

export interface ToolEvent {
  type: 'start' | 'progress' | 'output' | 'error' | 'complete';
  requestId: string;
  data: unknown;
  timestamp: Date;
}
EOF

    cat > src/types/config.ts << 'EOF'
/**
 * Configuration type definitions
 */

export interface AdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
EOF

    cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

    cd ../..
    print_success "Core interface package created"
}

# Create CLI frontend package
create_cli_frontend_package() {
    print_status "Creating CLI frontend package..."
    
    cd packages/cli-frontend
    
    cat > package.json << EOF
{
  "name": "@gemini-cli-adapter/cli-frontend",
  "version": "0.1.0",
  "description": "Universal CLI frontend for AI language models",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@gemini-cli-adapter/core-interface": "*",
    "@gemini-cli-adapter/shared-types": "*",
    "ink": "^6.0.1",
    "react": "^19.1.0",
    "yargs": "^17.7.2"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/yargs": "^17.0.32",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  }
}
EOF

    mkdir -p src
    cat > src/index.ts << 'EOF'
/**
 * CLI Frontend entry point
 */

export * from './cli.js';
export * from './components/index.js';
export * from './hooks/index.js';
EOF

    mkdir -p src/components src/hooks
    cat > src/components/index.ts << 'EOF'
export * from './App.js';
EOF

    cat > src/hooks/index.ts << 'EOF'
export * from './useAdapter.js';
EOF

    cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"]
}
EOF

    cd ../..
    print_success "CLI frontend package created"
}

# Create Google adapter package
create_google_adapter_package() {
    print_status "Creating Google adapter package..."
    
    cd packages/google-adapter
    
    cat > package.json << EOF
{
  "name": "@gemini-cli-adapter/google-adapter",
  "version": "0.1.0",
  "description": "Google Gemini adapter for GEMINI CLI",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@gemini-cli-adapter/core-interface": "*",
    "@google/genai": "^1.9.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  }
}
EOF

    mkdir -p src
    cat > src/index.ts << 'EOF'
/**
 * Google Gemini adapter implementation
 */

export { GoogleAdapter } from './GoogleAdapter.js';
EOF

    cat > src/GoogleAdapter.ts << 'EOF'
import { CoreAdapter, ChatConfig, ChatEvent, ToolMetadata, ToolRequest, ToolEvent, AdapterConfig, ValidationResult } from '@gemini-cli-adapter/core-interface';

export class GoogleAdapter implements CoreAdapter {
  readonly id = 'google-gemini';
  readonly name = 'Google Gemini';
  readonly version = '0.1.0';

  async createSession(config: ChatConfig): Promise<string> {
    // TODO: Implement session creation
    throw new Error('Not implemented');
  }

  async *sendMessage(sessionId: string, message: string): AsyncIterable<ChatEvent> {
    // TODO: Implement message sending
    throw new Error('Not implemented');
  }

  async getAvailableTools(): Promise<ToolMetadata[]> {
    // TODO: Implement tool discovery
    return [];
  }

  async *executeTools(requests: ToolRequest[]): AsyncIterable<ToolEvent> {
    // TODO: Implement tool execution
    throw new Error('Not implemented');
  }

  async validateConfig(config: AdapterConfig): Promise<ValidationResult> {
    // TODO: Implement config validation
    return { valid: true, errors: [], warnings: [] };
  }

  async initialize(): Promise<void> {
    // TODO: Implement initialization
  }

  async dispose(): Promise<void> {
    // TODO: Implement cleanup
  }
}
EOF

    cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

    cd ../..
    print_success "Google adapter package created"
}

# Create shared types package
create_shared_types_package() {
    print_status "Creating shared types package..."
    
    cd packages/shared-types
    
    cat > package.json << EOF
{
  "name": "@gemini-cli-adapter/shared-types",
  "version": "0.1.0",
  "description": "Shared TypeScript types for GEMINI CLI adapter",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

    mkdir -p src
    cat > src/index.ts << 'EOF'
/**
 * Shared types across all packages
 */

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface FileInfo {
  path: string;
  size: number;
  modified: Date;
}

export interface GitInfo {
  branch: string;
  commit: string;
  status: 'clean' | 'dirty';
}
EOF

    cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

    cd ../..
    print_success "Shared types package created"
}

# Create main CLI app
create_cli_app() {
    print_status "Creating main CLI application..."
    
    cd apps/cli
    
    cat > package.json << EOF
{
  "name": "ai-cli",
  "version": "0.1.0",
  "description": "Universal GEMINI CLI with pluggable adapters",
  "bin": {
    "ai-cli": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@gemini-cli-adapter/core-interface": "*",
    "@gemini-cli-adapter/cli-frontend": "*",
    "@gemini-cli-adapter/google-adapter": "*",
    "commander": "^11.1.0"
  },
  "devDependencies": {
    "tsx": "^4.7.1",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  }
}
EOF

    mkdir -p src
    cat > src/index.ts << 'EOF'
#!/usr/bin/env node

/**
 * GEMINI CLI - Universal CLI for AI language models
 */

import { Command } from 'commander';
import { GoogleAdapter } from '@gemini-cli-adapter/google-adapter';

const program = new Command();

program
  .name('ai-cli')
  .description('Universal CLI for AI language models with pluggable adapters')
  .version('0.1.0');

program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-a, --adapter <adapter>', 'AI adapter to use', 'google')
  .action(async (options) => {
    console.log(`Starting chat with ${options.adapter} adapter...`);
    
    // TODO: Initialize adapter and start chat
    const adapter = new GoogleAdapter();
    await adapter.initialize();
    
    console.log('Chat functionality coming soon!');
  });

program
  .command('list-adapters')
  .description('List available adapters')
  .action(() => {
    console.log('Available adapters:');
    console.log('  google - Google Gemini adapter');
    console.log('  More adapters coming soon!');
  });

program.parse();
EOF

    cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

    cd ../..
    print_success "Main CLI application created"
}

# Create GitHub workflows
create_github_workflows() {
    print_status "Creating GitHub workflows..."
    
    cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Type check
      run: npm run typecheck
    
    - name: Test
      run: npm test
    
    - name: Build
      run: npm run build

  integration-test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [20]

    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Test CLI
      run: |
        cd apps/cli
        npm run build
        node dist/index.js --help
        node dist/index.js list-adapters
EOF

    cat > .github/workflows/release.yml << 'EOF'
name: Release

on:
  push:
    branches: [ main ]

jobs:
  release:
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, 'skip ci')"
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm test
    
    - name: Release
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      run: npx semantic-release
EOF

    print_success "GitHub workflows created"
}

# Create issue templates
create_issue_templates() {
    print_status "Creating issue templates..."
    
    cat > .github/ISSUE_TEMPLATE/bug_report.yml << 'EOF'
name: Bug Report
description: File a bug report to help us improve
title: "[Bug]: "
labels: ["bug", "triage"]

body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!

  - type: input
    id: version
    attributes:
      label: Version
      description: What version of gemini-cli-adapter are you running?
      placeholder: e.g. 0.1.0
    validations:
      required: true

  - type: dropdown
    id: adapter
    attributes:
      label: Adapter
      description: Which adapter were you using?
      options:
        - Google Gemini
        - Custom adapter
        - Other
    validations:
      required: true

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us, what did you expect to happen?
      placeholder: Tell us what you see!
    validations:
      required: true

  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      description: How can we reproduce this issue?
      placeholder: |
        1. Run command...
        2. Enter input...
        3. See error...
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      description: Please copy and paste any relevant log output.
      render: shell
EOF

    cat > .github/ISSUE_TEMPLATE/feature_request.yml << 'EOF'
name: Feature Request
description: Suggest an idea for this project
title: "[Feature]: "
labels: ["enhancement", "triage"]

body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a feature!

  - type: textarea
    id: problem
    attributes:
      label: Is your feature request related to a problem?
      description: A clear description of what the problem is.
      placeholder: I'm always frustrated when...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear description of what you want to happen.
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Describe alternatives you've considered
      description: Any alternative solutions or features you've considered.

  - type: textarea
    id: additional-context
    attributes:
      label: Additional context
      description: Add any other context or screenshots about the feature request.
EOF

    cat > .github/ISSUE_TEMPLATE/adapter_request.yml << 'EOF'
name: Adapter Request
description: Request support for a new AI provider
title: "[Adapter]: "
labels: ["adapter", "enhancement"]

body:
  - type: input
    id: provider
    attributes:
      label: AI Provider
      description: Which AI provider would you like to see supported?
      placeholder: e.g. OpenAI, Anthropic, Cohere
    validations:
      required: true

  - type: input
    id: api-docs
    attributes:
      label: API Documentation
      description: Link to the provider's API documentation
      placeholder: https://...

  - type: textarea
    id: use-case
    attributes:
      label: Use case
      description: Why would this adapter be useful?
    validations:
      required: true

  - type: checkboxes
    id: contribution
    attributes:
      label: Contribution
      options:
        - label: I'm willing to help implement this adapter
        - label: I can provide API keys for testing
        - label: I can help with documentation
EOF

    print_success "Issue templates created"
}

# Create documentation
create_documentation() {
    print_status "Creating documentation..."
    
    cat > README.md << EOF
# GEMINI CLI Adapter

$PROJECT_DESCRIPTION

## 🚀 Features

- **Universal Interface**: Single CLI that works with multiple AI providers
- **Pluggable Adapters**: Easy to add support for new AI services
- **Rich Terminal UI**: Beautiful, interactive command-line interface
- **Tool Integration**: Execute tools and commands through AI assistants
- **Open Source**: MIT licensed, community-driven development

## 📦 Installation

\`\`\`bash
npm install -g ai-cli
\`\`\`

## 🎯 Quick Start

\`\`\`bash
# Start a chat session
ai-cli chat

# List available adapters
ai-cli list-adapters

# Use specific adapter
ai-cli chat --adapter google
\`\`\`

## 🔌 Supported Adapters

- **Google Gemini** - Google's latest AI model
- More adapters coming soon!

## 🛠️ Development

\`\`\`bash
# Clone the repository
git clone https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git
cd $PROJECT_NAME

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development
npm run dev
\`\`\`

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
EOF

    cat > CONTRIBUTING.md << 'EOF'
# Contributing to GEMINI CLI Adapter

Thank you for your interest in contributing to GEMINI CLI Adapter! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit pull requests for bug fixes and features
- **Adapter Development**: Create adapters for new AI providers
- **Documentation**: Improve our docs and guides
- **Testing**: Help test new features and report issues

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- TypeScript knowledge

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/gemini-cli-adapter.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

### Building and Testing

```bash
# Build all packages
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## 📝 Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `adapter/provider-name` - New adapter implementations
- `docs/description` - Documentation updates

### Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/):

```
feat: add OpenAI adapter support
fix: resolve chat session timeout issue
docs: update adapter creation guide
```

### Pull Request Process

1. Ensure all tests pass
2. Update documentation as needed
3. Add tests for new functionality
4. Follow the existing code style
5. Fill out the PR template completely

## 🔌 Creating Adapters

### Adapter Structure

New adapters should implement the `CoreAdapter` interface:

```typescript
import { CoreAdapter } from '@gemini-cli-adapter/core-interface';

export class MyAdapter implements CoreAdapter {
  readonly id = 'my-provider';
  readonly name = 'My Provider';
  readonly version = '0.1.0';
  
  // Implement required methods...
}
```

### Adapter Guidelines

- Follow the existing patterns in `packages/google-adapter`
- Include comprehensive tests
- Add configuration validation
- Document all public methods
- Handle errors gracefully

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test -w packages/core-interface

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

We aim for 90%+ test coverage. Please include tests for:

- New features and bug fixes
- Edge cases and error conditions
- Adapter implementations
- Configuration validation

## 📚 Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update relevant docs with changes
- Follow existing formatting patterns

### Documentation Structure

- `docs/guides/` - User guides and tutorials
- `docs/api/` - API reference documentation
- `README.md` - Project overview and quick start
- Package-level README files for detailed usage

## 🐛 Reporting Issues

When reporting issues, please include:

- Version information
- Steps to reproduce
- Expected vs actual behavior
- Relevant log output
- Environment details (OS, Node.js version)

## 💬 Getting Help

- GitHub Discussions for questions and ideas
- GitHub Issues for bugs and feature requests
- Check existing issues before creating new ones

## 📄 License

By contributing to GEMINI CLI Adapter, you agree that your contributions will be licensed under the MIT License.

## 🎉 Recognition

Contributors will be recognized in our README and release notes. Thank you for helping make GEMINI CLI Adapter better!
EOF

    cat > CODE_OF_CONDUCT.md << 'EOF'
# Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

- Being respectful of differing viewpoints and experiences
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing to those affected by our mistakes
- Focusing on what is best not just for us as individuals, but for the overall community

Examples of unacceptable behavior:

- The use of sexualized language or imagery, and sexual attention or advances of any kind
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without their explicit permission

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement. All complaints will be reviewed and investigated promptly and fairly.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.0.
EOF

    mkdir -p docs/guides
    cat > docs/guides/getting-started.md << 'EOF'
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
EOF

    print_success "Documentation created"
}

# Create additional configuration files
create_additional_configs() {
    print_status "Creating additional configuration files..."
    
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output

# Logs
logs/
*.log

# Cache
.npm
.eslintcache
.cache/
EOF

    cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 GEMINI CLI Adapter Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

    cat > .nvmrc << 'EOF'
20
EOF

    print_success "Additional configuration files created"
}

# Initialize git repository
initialize_git() {
    print_status "Initializing Git repository..."
    
    git init
    git add .
    git commit -m "feat: initial project setup with monorepo structure

- Add core interface definitions
- Add CLI frontend package
- Add Google adapter implementation
- Add comprehensive documentation
- Setup GitHub workflows and issue templates
- Configure TypeScript, ESLint, and Prettier"

    if [[ -n "$GITHUB_USERNAME" ]]; then
        print_status "Git repository initialized. To push to GitHub:"
        echo "git remote add origin https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"
        echo "git branch -M main"
        echo "git push -u origin main"
    fi
    
    print_success "Git repository initialized"
}

# Final setup steps
final_setup() {
    print_status "Running final setup steps..."
    
    # Install dependencies
    npm install
    
    # Build all packages
    npm run build
    
    # Run tests to ensure everything works
    npm test
    
    print_success "Project setup complete!"
}

# Display completion message
show_completion_message() {
    echo
    print_success "🎉 GEMINI CLI Adapter project has been successfully created!"
    echo
    echo "📁 Project location: $(pwd)"
    echo "🏗️  Architecture: Monorepo with workspaces"
    echo "📦 Packages: core-interface, cli-frontend, google-adapter, shared-types"
    echo "🔧 Tools: TypeScript, ESLint, Prettier, Vitest"
    echo "🚀 CI/CD: GitHub Actions workflows configured"
    echo
    print_status "Next steps:"
    echo "  1. cd $PROJECT_NAME"
    echo "  2. Create GitHub repository: https://github.com/new"
    echo "  3. git remote add origin https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"
    echo "  4. git push -u origin main"
    echo "  5. Start development: npm run dev"
    echo
    print_status "Start a new Claude session in this directory to continue development!"
}

# Main execution
main() {
    get_user_input
    create_directory_structure
    create_root_package_json
    create_typescript_config
    create_eslint_config
    create_prettier_config
    create_core_interface_package
    create_cli_frontend_package
    create_google_adapter_package
    create_shared_types_package
    create_cli_app
    create_github_workflows
    create_issue_templates
    create_documentation
    create_additional_configs
    initialize_git
    final_setup
    show_completion_message
}

# Run the script
main "$@"