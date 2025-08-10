# Direct Core Integration: Comprehensive Migration Guide for packages/open-cli

## Executive Summary

This document details the **direct integration approach** for replacing the complex adapter architecture in `packages/open-cli` with the unified `@open-cli/core` orchestration interface. This approach eliminates adapter complexity and provides a clean, single entry point for all AI interactions.

## Integration Philosophy

### Current Architecture (Complex)
```
CLI → AdapterFactory → GoogleAdapter → @google/gemini-cli-core
    ↳ ChatService, ToolingService, WorkspaceService, etc.
    ↳ Multiple service abstractions and transformations
```

### Target Architecture (Simplified)  
```
CLI → Core.chat() / Core.chatStream()
    ↳ All provider/tool complexity handled internally
    ↳ Single unified interface with internal orchestration
```

## Comprehensive File-by-File Migration Plan

### 1. Package Configuration Changes

#### A. `package.json` - Dependency Updates
**File:** `/packages/open-cli/package.json`

**REMOVE:**
```json
"@google/gemini-cli-core": "^0.1.13"
"@open-cli/interface": "*"
"@open-cli/gemini-adapter": "*"
```

**ADD:**
```json
"@open-cli/core": "*"
```

**Impact:** Eliminates complex adapter ecosystem, replaces with single core dependency.

#### B. `tsconfig.json` - Type Resolution Updates  
**File:** `/packages/open-cli/tsconfig.json`

**UPDATE references to:**
```json
{
  "references": [
    { "path": "../open-core" }
  ]
}
```

### 2. Entry Point Transformation

#### A. `index.ts` - Export Updates
**File:** `/packages/open-cli/index.ts`

**BEFORE:**
```typescript
import './dist/gemini.js';
export { main } from './dist/gemini.js';
export { LoadedSettings, SettingScope, Settings } from './dist/config/settings.js';
```

**AFTER:**
```typescript
import './dist/main.js';
export { main } from './dist/main.js';
export { LoadedSettings, SettingScope, Settings } from './dist/config/settings.js';
// Re-export Core types for external packages
export type { Core, CoreConfig, ChatInput, ChatResponse, StreamEvent } from '@open-cli/core';
```

#### B. `src/gemini.tsx` → `src/main.tsx` - Core Initialization
**File:** `/packages/open-cli/src/gemini.tsx` → `/packages/open-cli/src/main.tsx`

**BEFORE (Complex adapter initialization):**
```typescript
import { Config, AuthType, ApprovalMode, ShellTool, EditTool, WriteFileTool } from '@google/gemini-cli-core';
import { createAdapterFromConfig } from './adapters/adapterFactory.js';
import { CLIProvider } from '@open-cli/interface';

const config = loadCliConfig(cliArgs, settings);
const adapter = await createAdapterFromConfig(config, settings);
// Complex adapter-based initialization...
```

**AFTER (Direct Core usage):**
```typescript
import { Core, CoreConfig, type ChatInput } from '@open-cli/core';

// Simple, direct Core initialization
const coreConfig = await CoreConfig.forCLI({
  providers: {
    providers: new Map([
      ['anthropic', { 
        name: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        apiKey: process.env.ANTHROPIC_API_KEY 
      }],
      ['openai', { 
        name: 'openai', 
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY 
      }],
      ['google', {
        name: 'google',
        model: 'gemini-1.5-pro',
        apiKey: process.env.GEMINI_API_KEY
      }]
    ]),
    defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'anthropic'
  },
  workspace: {
    projectRoot: process.cwd()
  }
});

const core = new Core(coreConfig);
```

### 3. UI Layer Integration Changes

#### A. `src/ui/App.tsx` - Props and State Updates
**File:** `/packages/open-cli/src/ui/App.tsx`

**BEFORE:**
```typescript
interface AppProps {
  adapter: CLIProvider;
  config: Config;
  settings: LoadedSettings;
  startupWarnings?: string[];
}

export function App({ adapter, config, settings, startupWarnings }: AppProps) {
  // Complex adapter-based state management
}
```

**AFTER:**
```typescript
interface AppProps {
  core: Core;
  settings: LoadedSettings;
  startupWarnings?: string[];
}

export function App({ core, settings, startupWarnings }: AppProps) {
  // Direct Core usage throughout component
  const [selectedProvider, setSelectedProvider] = useState<string>();
  const [selectedModel, setSelectedModel] = useState<string>();
  
  useEffect(() => {
    // Initialize provider selection from Core
    core.getDefaultProvider().then(setSelectedProvider);
  }, [core]);
}
```

#### B. `src/ui/hooks/useGeminiStream.ts` → `useCoreStream.ts` - Complete Rewrite
**File:** `/packages/open-cli/src/ui/hooks/useGeminiStream.ts` → `/packages/open-cli/src/ui/hooks/useCoreStream.ts`

**BEFORE (100+ lines of adapter complexity):**
```typescript
export const useGeminiStream = (
  adapter: CLIProvider,
  history: HistoryItem[],
  addItem: UseHistoryManagerReturn['addItem'],
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
  onDebugMessage: (message: string) => void,
  handleSlashCommand: (cmd: PartListUnion) => Promise<SlashCommandProcessorResult | false>,
  // ... 10+ more parameters
) => {
  const chatService = adapter.chat;
  const toolingService = adapter.tools;
  const settingsService = adapter.settings;
  // ... complex service orchestration
}
```

**AFTER (Simplified Core interface):**
```typescript
import { Core, type ChatInput, type StreamEvent } from '@open-cli/core';

export const useCoreStream = (
  core: Core,
  history: HistoryItem[],
  addItem: UseHistoryManagerReturn['addItem'],
  selectedProvider: string,
  selectedModel: string,
  onDebugMessage: (message: string) => void,
  handleSlashCommand: (cmd: string) => Promise<SlashCommandProcessorResult | false>
) => {
  const [streamingState, setStreamingState] = useState<StreamingState>(StreamingState.Idle);
  const sessionId = useRef<string>('main-session');

  const sendMessage = useCallback(async (input: string) => {
    setStreamingState(StreamingState.WaitingForResponse);
    
    try {
      // Direct Core streaming - no adapter complexity
      const chatInput: ChatInput = {
        sessionID: sessionId.current,
        parts: [{ type: 'text', text: input }],
        providerID: selectedProvider,
        modelID: selectedModel
      };

      const stream = await core.chatStream(chatInput);
      
      for await (const event of stream) {
        handleStreamEvent(event);
      }
      
    } catch (error) {
      handleStreamError(error);
    }
  }, [core, selectedProvider, selectedModel]);

  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case 'text-delta':
        // Direct event handling - no transformation needed
        updateCurrentMessage(event.text);
        break;
        
      case 'tool-call':
        addToolCallToHistory(event);
        break;
        
      case 'tool-result':
        updateToolCallResult(event);
        break;
        
      case 'error':
        handleStreamError(event.error);
        break;
    }
  };

  return {
    sendMessage,
    streamingState,
    // ... simplified return interface
  };
};
```

#### C. `src/ui/components/Header.tsx` - Provider Display Updates
**File:** `/packages/open-cli/src/ui/components/Header.tsx`

**BEFORE:**
```typescript
// Complex adapter-based provider detection
const providerInfo = adapter.getProviderInfo();
```

**AFTER:**
```typescript
// Simple Core-based provider display
const [availableProviders, setAvailableProviders] = useState<string[]>([]);

useEffect(() => {
  core.getAvailableProviders().then(setAvailableProviders);
}, [core]);
```

### 4. Configuration System Integration

#### A. `src/config/config.ts` - Configuration Simplification
**File:** `/packages/open-cli/src/config/config.ts`

**BEFORE (Complex Config interface):**
```typescript
import { Config, AuthType } from '@google/gemini-cli-core';

export interface CliArgs {
  // ... extensive CLI argument definitions
}

export function loadCliConfig(args: CliArgs, settings: LoadedSettings): Config {
  // Complex configuration transformation logic
  return {
    // ... extensive config object
  };
}
```

**AFTER (CoreConfig integration):**
```typescript
import { CoreConfig } from '@open-cli/core';

export interface CliArgs {
  provider?: string;
  model?: string;
  question?: string;
  // Simplified CLI args focused on Core capabilities
}

export async function createCoreConfig(args: CliArgs, settings: LoadedSettings): Promise<CoreConfig.Info> {
  // Environment-based provider detection
  const providers = new Map();
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.set('anthropic', {
      name: 'anthropic',
      model: args.model || 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  
  if (process.env.OPENAI_API_KEY) {
    providers.set('openai', {
      name: 'openai', 
      model: args.model || 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.set('google', {
      name: 'google',
      model: args.model || 'gemini-1.5-pro', 
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  return {
    providers: {
      providers,
      defaultProvider: args.provider || process.env.DEFAULT_AI_PROVIDER || 'anthropic'
    },
    workspace: {
      projectRoot: process.cwd(),
      customInstructionPaths: ['CLAUDE.md', 'README.md']
    },
    tools: {
      permissions: {
        edit: true,
        shell: true,
        network: true,
        filesystem: true
      }
    }
  };
}
```

#### B. `src/config/auth.ts` - Authentication Simplification
**File:** `/packages/open-cli/src/config/auth.ts`

**BEFORE:**
```typescript
import { AuthType } from '@google/gemini-cli-core';
// Complex authentication type management
```

**AFTER:**
```typescript
// Authentication handled by Core internally via API keys
// This file can be significantly simplified or removed
export function validateApiKeys(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    missing.push('At least one AI provider API key (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY)');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}
```

### 5. Service Layer Elimination

#### A. DELETE: `src/adapters/` - Entire Directory
**Files to DELETE:**
- `src/adapters/adapterFactory.ts`
- Any other adapter-related files

**Reasoning:** Core's unified interface eliminates need for adapter pattern.

#### B. DELETE: `src/services/` - Provider-Specific Services  
**Files to REVIEW and potentially DELETE:**
- Service files that duplicate Core's internal capabilities
- Keep only CLI-specific services (command loading, etc.)

### 6. Command System Integration

#### A. `src/ui/commands/` - Command Updates for Core
**Files:** All command files in `/packages/open-cli/src/ui/commands/`

**Pattern Changes:**
**BEFORE:**
```typescript
// Complex adapter service access
const toolingService = adapter.tools;
const availableTools = await toolingService.getAllTools();
```

**AFTER:**
```typescript
// Direct Core method calls
const availableTools = await core.getAvailableTools(selectedProvider, selectedModel);
```

**Specific Files to Update:**
- `toolsCommand.ts` - Use `core.getAvailableTools()`
- `memoryCommand.ts` - Use Core's session management
- `statsCommand.ts` - Use Core's session info methods
- `compressCommand.ts` - Use `core.compressSession()`
- `restoreCommand.ts` - Use `core.revertSession()`

#### B. `src/ui/hooks/slashCommandProcessor.ts` - Command Processing Updates
**File:** `/packages/open-cli/src/ui/hooks/slashCommandProcessor.ts`

**Integration Points:**
```typescript
// Update slash commands to use Core methods directly
export const useSlashCommandProcessor = (core: Core, selectedProvider: string, selectedModel: string) => {
  const processCommand = useCallback(async (command: string, args: string[]) => {
    switch (command) {
      case '/tools':
        const tools = await core.getAvailableTools(selectedProvider, selectedModel);
        return { type: 'tools-list', tools };
        
      case '/compress':
        await core.compressSession(sessionId);
        return { type: 'session-compressed' };
        
      case '/revert':
        await core.revertSession(sessionId, args[0]);
        return { type: 'session-reverted' };
        
      // ... other commands
    }
  }, [core, selectedProvider, selectedModel]);
};
```

### 7. Streaming and State Management

#### A. `src/ui/contexts/StreamingContext.tsx` - Context Updates
**File:** `/packages/open-cli/src/ui/contexts/StreamingContext.tsx`

**BEFORE:**
```typescript
interface StreamingContextType {
  adapter: CLIProvider;
  // ... complex adapter state
}
```

**AFTER:**
```typescript
interface StreamingContextType {
  core: Core;
  selectedProvider: string;
  selectedModel: string;
  availableProviders: string[];
}

export const StreamingProvider: React.FC<{ children: React.ReactNode; core: Core }> = ({ children, core }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  useEffect(() => {
    core.getAvailableProviders().then(providers => {
      setAvailableProviders(providers);
      if (!selectedProvider && providers.length > 0) {
        core.getDefaultProvider().then(setSelectedProvider);
      }
    });
  }, [core]);

  return (
    <StreamingContext.Provider value={{
      core,
      selectedProvider,
      setSelectedProvider,
      selectedModel,
      setSelectedModel,
      availableProviders
    }}>
      {children}
    </StreamingContext.Provider>
  );
};
```

#### B. `src/ui/contexts/SessionContext.tsx` - Session Management Updates
**File:** `/packages/open-cli/src/ui/contexts/SessionContext.tsx`

**BEFORE:**
```typescript
// Complex adapter-based session stats
```

**AFTER:**
```typescript
export const useSessionStats = (core: Core, sessionId: string) => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>();

  useEffect(() => {
    core.getSession(sessionId).then(setSessionInfo);
  }, [core, sessionId]);

  return sessionInfo;
};
```

### 8. Tool Integration Specific Changes

#### A. `src/ui/hooks/useReactToolScheduler.ts` - Tool Execution Updates  
**File:** `/packages/open-cli/src/ui/hooks/useReactToolScheduler.ts`

**BEFORE:**
```typescript
// Complex tool service interactions
const toolingService = adapter.tools;
const result = await toolingService.executeToolCall(toolCall);
```

**AFTER:**
```typescript
// Tools are executed automatically by Core during streaming
// This hook may be simplified to just track tool call states from stream events
export const useToolCallTracker = () => {
  const [activeToolCalls, setActiveToolCalls] = useState<Map<string, TrackedToolCall>>(new Map());

  const handleToolCallEvent = (event: StreamEvent) => {
    if (event.type === 'tool-call') {
      setActiveToolCalls(prev => new Map(prev.set(event.id, {
        id: event.id,
        name: event.toolName,
        status: 'running',
        startTime: Date.now()
      })));
    } else if (event.type === 'tool-result') {
      setActiveToolCalls(prev => {
        const updated = new Map(prev);
        const existing = updated.get(event.id);
        if (existing) {
          updated.set(event.id, {
            ...existing,
            status: 'completed',
            result: event.result,
            endTime: Date.now()
          });
        }
        return updated;
      });
    }
  };

  return { activeToolCalls, handleToolCallEvent };
};
```

### 9. Error Handling and Recovery

#### A. Error Type Updates
**Throughout codebase:**

**BEFORE:**
```typescript
import { UnauthorizedError, isNodeError } from '@google/gemini-cli-core';
```

**AFTER:**
```typescript
// Core provides its own error types through StreamEvent.error
const handleError = (error: Error | StreamEvent) => {
  if (error.type === 'error') {
    // Handle Core's structured error events
    switch (error.code) {
      case 'PROVIDER_ERROR':
        // Handle provider-specific errors
        break;
      case 'TOOL_ERROR': 
        // Handle tool execution errors
        break;
      case 'SESSION_ERROR':
        // Handle session management errors
        break;
    }
  }
};
```

### 10. Testing Updates

#### A. Test File Updates
**All test files need updates for:**
- Replace `CLIProvider` mocks with `Core` mocks
- Update service method calls to Core method calls
- Simplify test setup (no adapter complexity)

**Example:**
```typescript
// BEFORE
const mockAdapter: CLIProvider = {
  chat: mockChatService,
  tools: mockToolingService,
  // ... all service mocks
};

// AFTER  
const mockCore = {
  chat: jest.fn(),
  chatStream: jest.fn(),
  getAvailableProviders: jest.fn().mockResolvedValue(['anthropic', 'openai']),
  getDefaultProvider: jest.fn().mockResolvedValue('anthropic')
} as unknown as Core;
```

## Migration Benefits

### Eliminated Complexity
- ❌ **No more adapter pattern** - Direct Core interface
- ❌ **No service abstractions** - Single entry point
- ❌ **No type transformations** - Core provides unified types
- ❌ **No provider-specific code** - Core handles internally

### Enhanced Capabilities  
- ✅ **Multi-provider support** out of the box
- ✅ **Advanced tool system** with OpenCode patterns
- ✅ **Session management** with compression and revert
- ✅ **Optimized streaming** with structured events

### Simplified Architecture
- ✅ **Single dependency** (`@open-cli/core`)
- ✅ **Unified configuration** via `CoreConfig`
- ✅ **Direct method calls** instead of service abstractions
- ✅ **Clean separation** between UI and backend logic

## Migration Strategy

### Phase 1: Foundation (Files 1-3)
1. Update `package.json` dependencies
2. Transform main entry points
3. Update Core initialization

### Phase 2: UI Integration (Files 4-7)
1. Update App.tsx props and state
2. Rewrite streaming hooks
3. Update component integrations
4. Simplify configuration system

### Phase 3: Feature Updates (Files 8-10)  
1. Update command implementations
2. Simplify context providers
3. Update tool integrations
4. Fix error handling

### Phase 4: Testing & Cleanup
1. Update all test files
2. Remove unused files/directories
3. Validate feature parity
4. Performance optimization

## Success Metrics

- **Lines of Code Reduction**: Expected 30-40% reduction
- **Dependency Simplification**: Single core dependency
- **Feature Parity**: All existing functionality preserved
- **Performance**: Improved streaming and tool execution
- **Maintainability**: Simplified architecture with single entry point

This comprehensive migration transforms packages/open-cli from a complex adapter-based system to a clean, direct Core integration while preserving all existing user experience and functionality.