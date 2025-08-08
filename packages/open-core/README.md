# @open-cli/core

**OpenCode-inspired central orchestration engine for Open CLI**

A complete rewrite of the core architecture implementing OpenCode's sophisticated orchestration patterns while maintaining compatibility with Open CLI's provider ecosystem.

## Key Features

### 🎯 **Central Orchestration**
- **Single point of control** - All conversations flow through `Core.chat()`
- **OpenCode Session.chat() pattern** - Comprehensive flow from input to output
- **Provider agnostic** - Works with any AI provider through clean abstractions

### 🔄 **Advanced Session Management**
- **Session locking & queuing** - Prevents race conditions in concurrent access
- **Auto-compression** - Intelligent context management when approaching token limits
- **Conversation revert** - Rollback to any point with file system changes
- **State persistence** - Robust session state with recovery mechanisms

### 🌊 **Event-Driven Streaming**
- **Real-time processing** - Stream events for immediate UI updates
- **Tool execution tracking** - Detailed progress for each tool call
- **Error isolation** - Stream errors don't break entire conversations
- **Granular control** - Handle text, tool calls, steps, and errors separately

### 🛠️ **Dynamic Tool System**
- **Model-aware filtering** - Tools adapt to provider/model capabilities
- **OpenCode compatibility patterns** - Battle-tested tool selection logic
- **Parameter transformation** - Automatic provider-specific adjustments
- **Permission integration** - Respects security and user preferences

### 🎨 **Modular Prompt Engineering**
- **Provider-specific optimization** - Headers and prompts tuned for each model
- **Environment-aware** - Automatic context injection (git, project structure)
- **Custom instructions** - CLAUDE.md, AGENTS.md, CONTEXT.md support
- **Caching optimization** - Structured for prompt caching efficiency

### ⚡ **Provider Transforms**
- **Message optimization** - Clean tool call IDs, caching headers
- **Parameter tuning** - Temperature, topP optimized per model
- **Compatibility handling** - Automatic OpenAI nullable, Gemini sanitization
- **Performance patterns** - OpenCode's proven optimization strategies

## Architecture

```
packages/open-core/src/
├── index.ts                 # Core class - primary entry point
├── types/                   # Comprehensive type system
│   ├── sessions.ts          # Session and chat types
│   ├── messages.ts          # Message and part types  
│   ├── streaming.ts         # Stream event types
│   ├── providers.ts         # Provider abstraction types
│   └── tools.ts             # Tool system types
├── config/                  # Configuration system
│   └── CoreConfig.ts        # Modular configuration
├── orchestration/           # Central coordination
│   └── SessionOrchestrator.ts
├── state/                   # Session state management
│   └── SessionStateManager.ts
├── streaming/               # Event-driven streaming
│   └── StreamEventProcessor.ts
├── prompts/                 # Modular prompt system
│   └── SystemPromptAssembler.ts
├── providers/               # Provider transforms
│   └── ProviderTransformRegistry.ts
└── tools/                   # Dynamic tool registry
    └── DynamicToolRegistry.ts
```

## Quick Start

### Basic Usage

```typescript
import { Core, CoreConfig } from '@open-cli/core';

// Initialize with environment auto-detection
const core = new Core();

// Or with custom configuration
const config = CoreConfig.forCLI({
  providers: {
    providers: new Map([
      ['openai', { 
        name: 'openai', 
        model: 'gpt-4o-mini', 
        apiKey: process.env.OPENAI_API_KEY 
      }],
      ['anthropic', { 
        name: 'anthropic', 
        model: 'claude-3-5-sonnet-20241022', 
        apiKey: process.env.ANTHROPIC_API_KEY 
      }]
    ]),
    defaultProvider: 'anthropic'
  }
});
const core = new Core(config);

// Simple conversation
const response = await core.chat({
  sessionID: 'my-session',
  parts: [{ type: 'text', text: 'Hello, help me with my code!' }],
  providerID: 'anthropic',
  modelID: 'claude-3-5-sonnet-20241022'
});

console.log(response.parts[0].text);
```

### Streaming Conversations

```typescript
// Real-time streaming
const stream = await core.chatStream({
  sessionID: 'my-session',
  parts: [{ type: 'text', text: 'Write a Python function' }],
  providerID: 'openai',
  modelID: 'gpt-4o-mini'
});

for await (const event of stream) {
  switch (event.type) {
    case 'text-delta':
      process.stdout.write(event.text);
      break;
    case 'tool-call':
      console.log(`\\n🔧 Calling ${event.toolName}...`);
      break;
    case 'tool-result':
      console.log(`✅ Tool completed`);
      break;
  }
}
```

### Advanced Session Management

```typescript
// Session with auto-compression
const response = await core.chat({
  sessionID: 'long-session',
  parts: [{ type: 'text', text: 'Continue our previous discussion' }],
  providerID: 'anthropic',
  modelID: 'claude-3-5-sonnet-20241022'
});
// Auto-compresses when approaching context limits

// Revert to previous state
await core.revertSession('my-session', 'message_123');

// Manual compression
await core.compressSession('my-session');
```

### Tool Management

```typescript
// Get available tools for provider/model
const tools = await core.getAvailableTools('anthropic', 'claude-3-5-sonnet-20241022');
console.log(tools.map(t => t.function.name)); // ['edit', 'read_file', 'write_file', ...]

// Get recommendations
const recommendations = core.getToolRecommendations('anthropic', 'claude-3-5-sonnet-20241022');
console.log('Recommended:', recommendations.recommended);
console.log('Discouraged:', recommendations.discouraged);

// Validate compatibility
const result = core.validateToolCompatibility('patch', 'anthropic', 'claude-3-5-sonnet-20241022');
console.log('Compatible:', result.compatible);
console.log('Warnings:', result.warnings);
```

## Configuration

### Environment Variables

The core automatically detects providers from environment variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini          # optional
OPENAI_BASE_URL=https://...       # optional

# Anthropic  
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # optional

# Google
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-pro       # optional
```

### Custom Configuration

```typescript
import { CoreConfig } from '@open-cli/core';

const config = new CoreConfig({
  session: {
    compressionThreshold: 0.85,  // Compress at 85% of context
    preserveThreshold: 0.4,      // Keep 40% after compression
    enableRevert: true,          // Enable conversation revert
    outputReserve: 8192         // Reserve tokens for output
  },
  
  tools: {
    permissions: {
      edit: true,
      shell: false,              // Disable shell access
      network: true,
      filesystem: true
    },
    excludeTools: ['dangerous_tool']
  },
  
  workspace: {
    projectRoot: process.cwd(),
    customInstructionPaths: ['CLAUDE.md', 'INSTRUCTIONS.md']
  }
});
```

### Provider-Specific Configurations

```typescript
// CLI configuration (full permissions)
const cliConfig = CoreConfig.forCLI({
  session: { compressionThreshold: 0.9 }
});

// Extension configuration (restricted permissions)  
const extensionConfig = CoreConfig.forExtension({
  tools: { permissions: { edit: false, shell: false } }
});
```

## OpenCode Integration Patterns

This core implements battle-tested patterns from OpenCode:

### Session Orchestration
- **Comprehensive flow control** - Revert cleanup, compression checks, tool filtering
- **Resource management** - Session locking, request queuing, cleanup
- **Error recovery** - Graceful handling of provider failures and timeouts

### Provider Optimization
- **Model-specific parameters** - Temperature 0.55 for Qwen, 0 for others
- **Tool compatibility** - Patch disabled for Claude, todos disabled for GPT
- **Message transforms** - Clean tool call IDs, caching headers, parameter formats

### Advanced Features
- **Auto-compression** - Preserves 30% of recent conversation when context fills
- **Caching optimization** - Max 2 system messages for provider caching efficiency  
- **Dynamic prompts** - Environment context, custom instructions, mode-specific behavior

## Integration with Open CLI

The core serves as the primary interface for all agentic interactions:

```typescript
// Direct core usage - no adapters needed
import { Core } from '@open-cli/core';

// Initialize and use directly
const core = new Core();

const response = await core.chat({
  sessionID: 'main-session',
  parts: [{ type: 'text', text: 'Help me with my code' }],
  providerID: core.getDefaultProvider(),
  modelID: 'auto'
});

// Stream for real-time updates
for await (const event of await core.chatStream(input)) {
  // Handle streaming events
}
```

## Development Status

### ✅ Implemented
- Core orchestration architecture
- Session state management with locking/queuing
- Event-driven streaming system
- Modular prompt assembly
- Provider transform registry
- Dynamic tool filtering
- Comprehensive type system

### 🔄 In Progress  
- Provider adapter implementations
- Real tool registry integration
- File system snapshot system
- Telemetry and observability

### 📋 Planned
- MCP server integration
- Advanced caching strategies
- Performance optimizations
- Comprehensive test suite

## Attribution

Tool system design patterns inspired by [OpenCode](https://github.com/sst/opencode) (MIT licensed). 
Our implementation is independently written and adapted for Open CLI's provider-agnostic architecture.

## Contributing

This core represents a sophisticated orchestration engine inspired by OpenCode's proven patterns. Contributions should focus on:

1. **Provider adapters** - Implement real provider integrations
2. **Tool integrations** - Connect with existing Open CLI tool ecosystem
3. **Performance** - Optimize streaming and state management
4. **Testing** - Comprehensive test coverage for all patterns
5. **Documentation** - Usage examples and architectural guides

The goal is to provide **the best of both worlds** - OpenCode's orchestration sophistication with Open CLI's provider flexibility.

---

Built with ❤️ for the Open CLI community, inspired by OpenCode's battle-tested patterns.