# Creating Open CLI Adapters

Welcome to the Open CLI Adapter Development Guide! This comprehensive guide will walk you through creating your own adapter to integrate any AI provider with Open CLI.

## Table of Contents

- [Overview](#overview)
- [Understanding the CLIProvider Interface](#understanding-the-cliprovider-interface)
- [Development Setup](#development-setup)
- [Step-by-Step Development Process](#step-by-step-development-process)
- [Code Examples](#code-examples)
- [Testing Guidelines](#testing-guidelines)
- [Submission Process](#submission-process)
- [Best Practices](#best-practices)

## Overview

Open CLI uses a modular architecture where **adapters** serve as bridges between the unified CLI frontend and specific AI providers. Each adapter implements the `CLIProvider` interface, ensuring consistent functionality across different AI backends.

```
┌─────────────────────────────────────┐
│          CLI Frontend               │
│   (React + Ink Terminal UI)        │
├─────────────────────────────────────┤
│         CLIProvider Interface       │
│    (Your Adapter Implementation)    │
├─────────────────────────────────────┤
│           Your AI Provider          │
│   (OpenAI, Claude, Local Model)     │
└─────────────────────────────────────┘
```

## Understanding the CLIProvider Interface

The `CLIProvider` interface defines six core services that every adapter must implement:

### Core Interface Structure

```typescript
export interface CLIProvider {
  // Core services
  chat: ChatService;
  tools: ToolingService;
  workspace: WorkspaceService;
  auth: AuthService;
  memory: MemoryService;
  settings: SettingsService;

  // Telemetry methods
  isTelemetryInitialized(): boolean;
  shutdownTelemetry(): Promise<void>;
}
```

### Service Breakdown

#### 1. ChatService
Handles AI model interactions and chat sessions:

```typescript
interface ChatService {
  sendMessageStream(request: any, prompt_id: string): AsyncIterable<any>;
  getHistory(): Promise<any[]>;
  setHistory(history: any[]): Promise<void>;
  resetChat(): Promise<void>;
  tryCompressChat(promptId?: string, forceCompress?: boolean): Promise<any>;
  setTools(): Promise<void>;
  addHistory(content: any): Promise<void>;
}
```

#### 2. ToolingService
Manages tool execution and permissions:

```typescript
interface ToolingService {
  getTool(name: string): Promise<any | undefined>;
  getAllTools(): Promise<any[]>;
  executeToolCall(toolCall: any): Promise<any>;
  checkCommandPermissions(command: string, sessionAllowlist?: Set<string>): Promise<any>;
  getFunctionDeclarations(): Promise<any[]>;
  getToolRegistry(): Promise<any>;
  getShellExecutionService(): any;
  getPromptRegistry(): Promise<any>;
  getIdeClient(): any;
  createCoreToolScheduler(options: any): any;
}
```

#### 3. WorkspaceService
Handles file system and project operations:

```typescript
interface WorkspaceService {
  shouldIgnoreFile(filePath: string): Promise<boolean>;
  getProjectTempDir(): string;
  isGitRepository(): Promise<boolean>;
  getFileDiscoveryService(): any;
  getProjectRoot(): string;
}
```

#### 4. AuthService
Manages authentication and authorization:

```typescript
interface AuthService {
  refreshAuth(authType: any): Promise<void>;
  clearCachedCredentialFile(): Promise<void>;
  getAuthType(): any;
  isBrowserLaunchSuppressed(): boolean;
  validateAuthMethod(authMethod: string): string | null;
  getCodeAssistServer(): Promise<any>;
  mcpServerRequiresOAuth(serverName: string): boolean;
  getMCPOAuthProvider(serverName: string): any;
}
```

#### 5. MemoryService
Handles conversation memory and context:

```typescript
interface MemoryService {
  loadHierarchicalMemory(): Promise<{memoryContent: string; fileCount: number}>;
  getUserMemory(): string;
  setUserMemory(content: string): void;
  getGeminiMdFileCount(): number;
  setGeminiMdFileCount(count: number): void;
}
```

#### 6. SettingsService
Manages configuration and UI settings:

```typescript
interface SettingsService {
  getApprovalMode(): 'yolo' | 'auto_edit' | 'default';
  setApprovalMode(mode: 'yolo' | 'auto_edit' | 'default'): void;
  getProjectRoot(): string;
  getSessionId(): string;
  getModel(): string;
  // ... many more configuration methods
}
```

## Development Setup

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9.0.0
- **TypeScript** knowledge
- Access to your AI provider's API

### 1. Fork and Clone

```bash
git clone https://github.com/vketteni/open-cli.git
cd open-cli
npm install
```

### 2. Create Your Adapter Package

```bash
mkdir packages/your-adapter
cd packages/your-adapter
npm init -y
```

### 3. Update package.json

```json
{
  "name": "@open-cli/your-adapter",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@open-cli/interface": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### 4. Setup TypeScript

Create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../interface" }
  ]
}
```

## Step-by-Step Development Process

### Step 1: Create the Basic Adapter Structure

Create `src/your-adapter.ts`:

```typescript
import { 
  CLIProvider, 
  ChatService, 
  ToolingService, 
  WorkspaceService, 
  AuthService, 
  MemoryService, 
  SettingsService,
  LoadedSettings 
} from '@open-cli/interface';

export class YourAdapter implements CLIProvider {
  chat!: ChatService;
  tools!: ToolingService;
  workspace!: WorkspaceService;
  auth!: AuthService;
  memory!: MemoryService;
  settings!: SettingsService;

  private constructor(private config: YourConfig, private loadedSettings: LoadedSettings) {
    // Private constructor - use static create() method
  }

  static async create(config: YourConfig, settings: LoadedSettings): Promise<YourAdapter> {
    const adapter = new YourAdapter(config, settings);
    
    // Initialize services
    adapter.chat = new YourChatService(config);
    adapter.tools = new YourToolingService(config);
    adapter.workspace = new YourWorkspaceService(config);
    adapter.auth = new YourAuthService(config);
    adapter.memory = new YourMemoryService(config);
    adapter.settings = new YourSettingsService(config, settings);

    return adapter;
  }

  isTelemetryInitialized(): boolean {
    // Implement telemetry checking
    return false;
  }

  async shutdownTelemetry(): Promise<void> {
    // Implement telemetry shutdown
  }
}
```

### Step 2: Implement Service Classes

Start with the most critical service - `ChatService`:

```typescript
class YourChatService implements ChatService {
  constructor(private config: YourConfig) {}

  async *sendMessageStream(request: any, promptId: string): AsyncIterable<any> {
    // Connect to your AI provider's streaming API
    const stream = await this.config.client.streamChat(request.message);
    
    for await (const chunk of stream) {
      // Transform your provider's response format to Open CLI format
      yield {
        type: 'content',
        content: chunk.text,
        // ... other required fields
      };
    }
  }

  async getHistory(): Promise<any[]> {
    return this.config.chatHistory || [];
  }

  async setHistory(history: any[]): Promise<void> {
    this.config.chatHistory = history;
  }

  async resetChat(): Promise<void> {
    this.config.chatHistory = [];
  }

  async tryCompressChat(promptId?: string, forceCompress?: boolean): Promise<any> {
    // Implement chat compression logic if your provider supports it
    return { compressed: false };
  }

  async setTools(): Promise<void> {
    // Configure available tools for your AI provider
  }

  async addHistory(content: any): Promise<void> {
    this.config.chatHistory = this.config.chatHistory || [];
    this.config.chatHistory.push(content);
  }
}
```

### Step 3: Implement Authentication

```typescript
class YourAuthService implements AuthService {
  constructor(private config: YourConfig) {}

  async refreshAuth(authType: any): Promise<void> {
    switch (authType) {
      case 'api-key':
        // Initialize with API key
        this.config.client = new YourAPIClient(process.env.YOUR_API_KEY);
        break;
      case 'oauth':
        // Handle OAuth flow
        break;
      default:
        throw new Error(`Unsupported auth type: ${authType}`);
    }
  }

  validateAuthMethod(authMethod: string): string | null {
    if (authMethod === 'api-key' && !process.env.YOUR_API_KEY) {
      return 'YOUR_API_KEY environment variable not found';
    }
    return null;
  }

  // ... implement other auth methods
}
```

### Step 4: Register Your Adapter

Update `packages/open-cli/src/adapters/adapterFactory.ts`:

```typescript
import { YourAdapter } from '@open-cli/your-adapter';

export enum AdapterType {
  GOOGLE = 'google',
  YOUR_PROVIDER = 'your-provider', // Add your adapter type
}

const ADAPTER_REGISTRY = new Map([
  [AdapterType.GOOGLE, (config, settings) => GoogleAdapter.create(config, settings)],
  [AdapterType.YOUR_PROVIDER, (config, settings) => YourAdapter.create(config, settings)],
]);
```

### Step 5: Create Export File

Create `src/index.ts`:

```typescript
export { YourAdapter } from './your-adapter.js';
export * from './types.js'; // If you have custom types
```

## Code Examples

### Complete Minimal Adapter

Here's a simplified but complete adapter example:

```typescript
// src/minimal-adapter.ts
import { CLIProvider, ChatService, /* ... other services */ } from '@open-cli/interface';

class MinimalChatService implements ChatService {
  async *sendMessageStream(request: any, promptId: string): AsyncIterable<any> {
    // Simple echo implementation
    yield { type: 'content', content: `Echo: ${request.message || request}` };
  }
  
  async getHistory(): Promise<any[]> { return []; }
  async setHistory(history: any[]): Promise<void> {}
  async resetChat(): Promise<void> {}
  async tryCompressChat(): Promise<any> { return { compressed: false }; }
  async setTools(): Promise<void> {}
  async addHistory(content: any): Promise<void> {}
}

// Implement other minimal services similarly...

export class MinimalAdapter implements CLIProvider {
  chat = new MinimalChatService();
  tools = new MinimalToolingService();
  workspace = new MinimalWorkspaceService();
  auth = new MinimalAuthService();
  memory = new MinimalMemoryService();
  settings = new MinimalSettingsService();

  static async create(): Promise<MinimalAdapter> {
    return new MinimalAdapter();
  }

  isTelemetryInitialized(): boolean { return false; }
  async shutdownTelemetry(): Promise<void> {}
}
```

### Working with Streaming Responses

```typescript
async *sendMessageStream(request: any, promptId: string): AsyncIterable<any> {
  try {
    const response = await fetch('https://your-ai-api.com/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        message: request.message,
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          // Transform to Open CLI format
          yield {
            type: 'content',
            content: data.text,
            metadata: {
              model: data.model,
              promptId,
            }
          };
        }
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      error: error.message,
    };
  }
}
```

## Testing Guidelines

### 1. Unit Tests

Create comprehensive unit tests for each service:

```typescript
// src/__tests__/your-chat-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { YourChatService } from '../your-chat-service.js';

describe('YourChatService', () => {
  it('should stream responses correctly', async () => {
    const service = new YourChatService(mockConfig);
    const stream = service.sendMessageStream('Hello', 'test-prompt-id');
    
    const responses = [];
    for await (const response of stream) {
      responses.push(response);
    }
    
    expect(responses).toHaveLength(1);
    expect(responses[0].type).toBe('content');
  });
});
```

### 2. Integration Tests

Test your adapter with the actual CLI:

```bash
# Set environment variables for your adapter
export YOUR_API_KEY="test-key"
export GEMINI_ADAPTER_TYPE="your-provider"

# Build and test
npm run build
npm run dev -- "Test my new adapter"
```

### 3. Mock Provider Testing

Create a mock version of your AI provider for testing:

```typescript
class MockYourProvider {
  async *streamChat(message: string) {
    yield { text: `Mock response to: ${message}` };
  }
}
```

### 4. Test Checklist

- [ ] All service methods implemented
- [ ] Streaming responses work correctly
- [ ] Authentication flows function properly
- [ ] Error handling is robust
- [ ] Memory management works
- [ ] Settings are properly managed
- [ ] Tool execution is secure

## Submission Process

### 1. Pre-Submission Checklist

- [ ] Code follows TypeScript best practices
- [ ] All services implement required interfaces
- [ ] Comprehensive tests written and passing
- [ ] Documentation is complete
- [ ] No sensitive information in code
- [ ] Performance is acceptable

### 2. Create Pull Request

```bash
# Create feature branch
git checkout -b feature/your-adapter

# Add your adapter to workspace
# Update root package.json workspaces array:
"workspaces": [
  "packages/interface",
  "packages/open-cli", 
  "packages/gemini-adapter",
  "packages/your-adapter",  // Add this line
  "apps/*"
]

# Commit changes
git add .
git commit -m "feat: add YourProvider adapter

- Implement CLIProvider interface for YourProvider
- Add streaming chat support
- Include comprehensive authentication
- Add unit and integration tests"

# Push and create PR
git push origin feature/your-adapter
```

### 3. PR Requirements

Your pull request should include:

1. **Adapter Implementation**
   - Complete service implementations
   - Proper error handling
   - TypeScript types

2. **Tests**
   - Unit tests for all services
   - Integration tests
   - Mock implementations for testing

3. **Documentation**
   - README for your adapter
   - API documentation
   - Usage examples

4. **Configuration**
   - Update adapter factory
   - Add to workspace configuration
   - Environment variable documentation

### 4. Review Process

1. **Automated Checks**: CI will run tests and type checking
2. **Code Review**: Maintainers will review implementation
3. **Testing**: Manual testing of adapter functionality
4. **Documentation Review**: Ensure docs are complete and accurate
5. **Merge**: Once approved, your adapter will be merged

## Best Practices

### Security
- Never hardcode API keys or secrets
- Validate all user inputs
- Implement proper permission checking for tool execution
- Use secure authentication methods

### Performance
- Implement efficient streaming
- Cache responses when appropriate
- Handle rate limiting gracefully
- Minimize memory usage

### User Experience
- Provide clear error messages
- Support graceful degradation
- Implement progress indicators
- Handle network failures elegantly

### Code Quality
- Follow TypeScript strict mode
- Use proper error handling
- Write comprehensive tests
- Document complex logic
- Follow existing code patterns

### Compatibility
- Ensure compatibility with CLI features
- Support all required interface methods
- Handle different authentication types
- Work across different platforms

## Getting Help

- **GitHub Discussions**: Ask questions and get help from the community
- **Issues**: Report bugs or request features
- **Discord** (coming soon): Real-time chat with other developers
- **Code Review**: Request feedback during development

## Example Adapters

Study these reference implementations:

- **Google Adapter** (`packages/gemini-adapter/`): Production-ready implementation
- **Mock Adapter** (in tests): Minimal testing implementation

## Contributing to the Guide

This guide is community-maintained. If you find errors or want to add examples:

1. Edit this file
2. Submit a pull request
3. Help improve the developer experience for everyone

---

**Ready to build your adapter?** Start with the minimal example and gradually add features. The Open CLI community is here to help you succeed!