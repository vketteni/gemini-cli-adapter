# Extracting Reusable CLI Infrastructure from Google's Gemini CLI

*Technical lessons from turning a tightly-coupled tool into modular, reusable foundations*

---

## The Challenge: Preserving Battle-Tested Code While Enabling Reuse

Google's Gemini CLI is exceptional. It's fast, feature-rich, and has been battle-tested by thousands of users. But it's also architecturally coupled to Google's ecosystem - from authentication flows to API integrations, making it challenging to reuse its proven patterns with other AI providers. What if we could preserve everything that makes it great while making it reusable for other agentic CLI projects?

That's the technical challenge I tackled with **open-cli**: extracting the best parts of this tightly-coupled tool and rebuilding them as modular, reusable infrastructure.

This isn't just another rewrite. It's a surgical extraction that preserves production-quality code while creating clean service interfaces for reuse.

## The Extraction Strategy: Identify, Isolate, Abstract

### Phase 1: Understanding the Monolith

The original Gemini CLI was tightly integrated with Google's services. Authentication assumed Google OAuth, APIs were hardcoded to Google endpoints, and configuration was designed around Google's specific requirements.

But beneath the coupling, I found something valuable: **clean separation of concerns**. The architecture had natural boundaries—they were just buried under layers of concrete dependencies.

My first task was archaeological: mapping the implicit interfaces that already existed.

### Phase 2: Creating the Interface Layer

Instead of rewriting everything, I created interfaces that captured the existing behavior:

```typescript
// Before: Direct coupling to GoogleChat
const geminiClient = new GeminiClient(config);
const response = await geminiClient.sendMessage(prompt);

// After: Interface-based abstraction
interface ChatService {
  sendMessageStream(request: any, prompt_id: string): AsyncIterable<any>;
  getHistory(): Promise<any[]>;
  // ... other methods
}

const adapter = await createAdapterFromConfig(config, settings);
const response = adapter.chat.sendMessageStream(request, promptId);
```

The key insight: **I didn't change the behavior, I exposed it through interfaces**.

### Phase 3: Wrapping, Not Replacing

Rather than reimplementing Google's core functionality, I wrapped it:

```typescript
class GoogleChatService implements ChatService {
  private config: Config;
  private geminiClient?: GeminiClient;

  constructor(config: Config) {
    this.config = config;
    // Note: Lazy initialization - no behavior change
  }

  async *sendMessageStream(request: any, prompt_id: string): AsyncIterable<any> {
    await this.ensureAuthenticated();
    
    // Direct delegation to original implementation
    const abortController = new AbortController();
    const stream = this.geminiClient!.sendMessageStream(
      request, 
      abortController.signal, 
      prompt_id
    );
    
    for await (const chunk of stream) {
      yield chunk; // Zero transformation overhead
    }
  }
}
```

This wrapper pattern gave me several advantages:
- **Zero behavior change**: Existing functionality works identically
- **Gradual migration**: I could extract components incrementally  
- **Bug preservation**: I inherited years of bug fixes and edge case handling
- **Performance preservation**: No additional abstraction overhead

## Architectural Decisions: Learning from the Original

### What I Kept: The Proven Parts

**1. React + Ink Terminal UI**
The original's terminal interface was exceptional. Rich interactions, streaming responses, and complex state management—all in a terminal. I extracted this entire layer unchanged:

```typescript
// Original UI components work without modification
import { AppWrapper } from './ui/App.js';
import { render } from 'ink';

// Now powered by any adapter
const adapter = await createAdapterFromConfig(config, settings);
render(<AppWrapper adapter={adapter} />);
```

**2. Comprehensive Tool System**
The tool execution engine was robust, with proper permission checking, sandboxing, and error handling. I preserved this through the ToolingService interface:

```typescript
interface ToolingService {
  executeToolCall(toolCall: any): Promise<any>;
  checkCommandPermissions(command: string, sessionAllowlist?: Set<string>): Promise<any>;
  getFunctionDeclarations(): Promise<any[]>;
}
```

**3. Authentication Complexity**
Google's auth system handles OAuth, API keys, service accounts, and Cloud Shell authentication. Rather than simplifying this away, I preserved the full complexity through the AuthService interface—because this complexity serves real user needs.

### What I Improved: Fixing Design Debt

**1. Dependency Injection**
The original used global singletons and direct imports. I introduced proper dependency injection:

```typescript
// Before: Global dependencies
import { getGlobalConfig } from './config';
import { getGlobalClient } from './client';

// After: Injected dependencies  
class GoogleAdapter implements CLIProvider {
  constructor(private config: Config, private settings: LoadedSettings) {}
  
  static async create(config: Config, settings: LoadedSettings): Promise<GoogleAdapter> {
    // All dependencies provided explicitly
  }
}
```

**2. Async Initialization**
The original had complex startup sequences with timing issues. I made initialization explicit and async:

```typescript
export class GoogleAdapter implements CLIProvider {
  private constructor(private config: Config, private settings: LoadedSettings) {
    // Constructor does minimal work
  }

  static async create(config: Config, settings: LoadedSettings): Promise<GoogleAdapter> {
    await config.initialize(); // All async work happens here
    const adapter = new GoogleAdapter(config, settings);
    // Initialize services...
    return adapter;
  }
}
```

**3. Service Boundaries**
I made implicit service boundaries explicit through interfaces. This improved testability and made extension points clear.

## The Modularization Process: Package Architecture

### Monorepo Structure
I organized the extracted code into clear packages:

```
packages/
├── interface/          # Core interfaces and types
├── open-cli/          # Frontend CLI implementation
├── gemini-adapter/    # Google-specific adapter
└── [future-adapters]/ # OpenAI, Anthropic, local models...

apps/
└── open-cli/          # CLI application entry point
```

Each package has clear responsibilities:
- **interface**: Defines contracts, no implementations
- **open-cli**: UI and core CLI logic, adapter-agnostic
- **gemini-adapter**: Wraps Google's core, implements interfaces
- **apps/open-cli**: Entry point, wires everything together

### Build System: Incremental Compilation
I used TypeScript project references for fast, incremental builds:

```json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "declaration": true
  },
  "references": [
    { "path": "./packages/interface" },
    { "path": "./packages/gemini-adapter" },
    { "path": "./packages/open-cli" }
  ]
}
```

This gives us:
- **Fast rebuilds**: Only changed packages recompile
- **Type checking**: Cross-package type safety
- **IDE support**: IntelliSense works across package boundaries

## Lessons Learned: What Worked and What Didn't

### Success: Interface-First Design
Creating interfaces before implementations forced us to think about contracts rather than details. This led to cleaner, more flexible designs.

### Success: Wrapper Pattern
Wrapping existing code instead of rewriting preserved years of production hardening while enabling modularity.

### Success: Incremental Migration
I didn't try to extract everything at once. I started with core interfaces and gradually moved components over. This kept the system working throughout the process.

### Challenge: Authentication Complexity
Google's authentication system is intricate. Preserving all the edge cases while making it generic was one of my biggest challenges. The solution was to embrace the complexity rather than hide it:

```typescript
class GoogleAuthService implements AuthService {
  private async ensureAuthenticated(): Promise<void> {
    // Handle all Google auth methods: OAuth, API keys, Vertex AI, Cloud Shell
    let authType = this.determineAuthType();
    await this.config.refreshAuth(authType);
  }
}
```

### Challenge: Type Safety Across Boundaries
Maintaining TypeScript type safety while supporting multiple adapters required careful interface design. I used discriminated unions and generic constraints extensively.

### Pitfall Avoided: Over-Abstraction
I resisted the urge to create overly generic abstractions. Instead, I stayed close to the original interfaces and let patterns emerge naturally.

## Results: Reusable Infrastructure

### Code Quality Improvements
- **Type safety**: Strong typing throughout the interface layer
- **Modular structure**: Clear package boundaries and dependencies
- **Build system**: Incremental compilation with TypeScript project references
- **Interface contracts**: Well-defined service boundaries for testability

### Reusability Benefits
- **Feature preservation**: 100% compatibility with original functionality
- **Performance**: Identical to original (zero abstraction overhead)
- **Extensibility**: New integrations can be added without touching core code

### Developer Experience
- **Clear boundaries**: Package structure makes contribution points obvious
- **Type safety**: IntelliSense works across the entire codebase
- **Test isolation**: Each adapter can be tested independently
- **Documentation**: Interface comments serve as implementation guides

## The Broader Impact: From Extraction to Foundation

This extraction demonstrates a pattern for creating reusable infrastructure from excellent monolithic tools.

### For Other Projects
The techniques I used—interface extraction, wrapper patterns, incremental migration—can be applied to other monolithic tools. The pattern is:

1. **Map implicit boundaries** in the existing code
2. **Create interfaces** that capture current behavior
3. **Wrap, don't rewrite** existing implementations
4. **Extract incrementally** to keep the system working
5. **Modularize gradually** as patterns become clear

### For the Developer Community
By extracting and open-sourcing this codebase, I've created:
- **A working reference implementation** for complex CLI architecture
- **Reusable UI components** for terminal applications
- **Proven patterns** for async initialization and service composition
- **Foundational infrastructure** for building similar tools

## The Technical Details: Dive Deeper

Want to see exactly how the extraction worked? The complete codebase is available with detailed commit history showing the transformation:

- **Interface definitions**: `packages/interface/src/adapter.ts`
- **Google adapter implementation**: `packages/gemini-adapter/src/google-adapter.ts`
- **Factory pattern**: `packages/open-cli/src/adapters/adapterFactory.ts`
- **UI extraction**: `packages/open-cli/src/ui/`

Each major component includes documentation explaining the extraction decisions and trade-offs.

## Contributing to the Foundation

This modular infrastructure works, but there's potential to make it even more useful with contributor input.

**If this technical approach interests you:**
- **Examine the codebase**: Study the interfaces and implementation patterns
- **Improve the foundation**: Better TypeScript types, testing helpers, documentation
- **Build integrations**: OpenAI, Claude, or local model implementations
- **Share technical feedback**: What patterns work well? What could be improved?

The extraction proves the concept works, but the real value comes from developers who see ways to strengthen the foundation.

**Interested in contributing?** Check out the [technical architecture docs](https://github.com/vketteni/open-cli/blob/main/CONTRIBUTING.md) and interface definitions.

---

*Follow the [open-cli project](https://github.com/vketteni/open-cli) for technical updates and discussions about reusable CLI infrastructure patterns. Built by [@vketteni](https://github.com/vketteni).*