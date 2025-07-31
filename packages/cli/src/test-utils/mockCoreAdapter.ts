/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi } from 'vitest';
import { CoreAdapter } from '@gemini-cli-adapter/core-interface';

// A utility type to make all properties of an object, and its nested objects, partial.
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Creates a comprehensive mock of the CoreAdapter for use in tests.
 * All methods are pre-mocked with `vi.fn()` and return reasonable defaults.
 *
 * @param overrides - A deep partial object to override any default mock values.
 * @returns A complete, mocked CoreAdapter object.
 */
export const createMockCoreAdapter = (
  overrides: DeepPartial<CoreAdapter> = {},
): CoreAdapter => {
  const defaultMocks: CoreAdapter = {
    // Core lifecycle
    initialize: vi.fn().mockResolvedValue(undefined),
    isTelemetryInitialized: vi.fn().mockReturnValue(false),

    // Chat Service
    chat: {
      sendMessageStream: vi.fn().mockReturnValue(async function* () {
        yield { type: 'content', text: 'Mock response' };
      }),
      getHistory: vi.fn().mockResolvedValue([]),
      setHistory: vi.fn().mockResolvedValue(undefined),
      resetChat: vi.fn().mockResolvedValue(undefined),
      tryCompressChat: vi.fn().mockResolvedValue({ compressed: false }),
      getCompressionMetadata: vi.fn().mockReturnValue({
        lastCompressionAttempt: null,
        totalCompressions: 0,
      }),
    },

    // Tooling Service
    tooling: {
      getTool: vi.fn().mockReturnValue(null),
      getAllTools: vi.fn().mockReturnValue([]),
      getToolRegistry: vi.fn().mockReturnValue({
        getTool: vi.fn(),
        getAllTools: vi.fn().mockReturnValue([]),
        discoverMcpTools: vi.fn().mockResolvedValue([]),
        discoverToolsForServer: vi.fn().mockResolvedValue([]),
      }),
      discoverMcpTools: vi.fn().mockResolvedValue([]),
      discoverToolsForServer: vi.fn().mockResolvedValue([]),
      executeToolCall: vi.fn().mockResolvedValue({
        status: 'success',
        result: { output: 'Mock tool result' },
      }),
      createToolScheduler: vi.fn().mockReturnValue({
        scheduleToolCall: vi.fn(),
        processToolCall: vi.fn(),
        cancel: vi.fn(),
      }),
      getShellExecutionService: vi.fn().mockReturnValue({
        executeCommand: vi.fn().mockResolvedValue({
          stdout: 'Mock command output',
          stderr: '',
          exitCode: 0,
        }),
        checkCommandPermissions: vi.fn().mockResolvedValue(true),
      }),
      isBrowserLaunchSuppressed: vi.fn().mockReturnValue(false),
    },

    // Workspace Service
    workspace: {
      getProjectRoot: vi.fn().mockReturnValue('/mock/project'),
      getProjectTempDir: vi.fn().mockReturnValue('/mock/project/.tmp'),
      getUserCommandsDir: vi.fn().mockReturnValue('/mock/user/commands'),
      getProjectCommandsDir: vi.fn().mockReturnValue('/mock/project/commands'),
      shouldIgnoreFile: vi.fn().mockReturnValue(false),
      unescapePath: vi.fn().mockImplementation((path) => path),
      escapePath: vi.fn().mockImplementation((path) => path),
      restoreProjectFromSnapshot: vi.fn().mockResolvedValue(undefined),
      isGitRepository: vi.fn().mockReturnValue(true),
      getFileDiscoveryService: vi.fn().mockReturnValue({
        shouldIgnoreFile: vi.fn().mockReturnValue(false),
        discoverFiles: vi.fn().mockResolvedValue([]),
      }),
    },

    // Auth Service
    auth: {
      getAuthType: vi.fn().mockReturnValue('LOGIN_WITH_GOOGLE'),
      refreshAuth: vi.fn().mockResolvedValue(undefined),
      clearCachedCredentialFile: vi.fn().mockResolvedValue(undefined),
      mcpServerRequiresOAuth: vi.fn().mockReturnValue(false),
      getMCPOAuthProvider: vi.fn().mockReturnValue(null),
      validateAuth: vi.fn().mockResolvedValue(true),
      getCodeAssistServer: vi.fn().mockReturnValue(null),
    },

    // Memory Service
    memory: {
      loadServerHierarchicalMemory: vi.fn().mockResolvedValue('Mock memory content'),
      setUserMemory: vi.fn().mockResolvedValue(undefined),
      getUserMemory: vi.fn().mockReturnValue('Mock user memory'),
      getMemoryFileCount: vi.fn().mockReturnValue(0),
    },

    // Settings Service
    settings: {
      getModel: vi.fn().mockReturnValue('gemini-1.5-pro'),
      getDefaultModel: vi.fn().mockReturnValue('gemini-1.5-pro'),
      getFileFilteringOptions: vi.fn().mockReturnValue({
        include: [],
        exclude: [],
        maxFiles: 100,
      }),
      getSessionId: vi.fn().mockReturnValue('mock-session-id'),
      getMaxSessionTurns: vi.fn().mockReturnValue(50),
      getCheckpointingEnabled: vi.fn().mockReturnValue(false),
      getIdeMode: vi.fn().mockReturnValue(false),
      getSandboxConfig: vi.fn().mockReturnValue({
        enabled: false,
        allowedCommands: [],
        blockedCommands: [],
      }),
      getTargetDir: vi.fn().mockReturnValue('/mock/target'),
      getDebugMode: vi.fn().mockReturnValue(false),
      getFullContext: vi.fn().mockReturnValue(false),
      getCoreTools: vi.fn().mockReturnValue([]),
      getToolDiscoveryCommand: vi.fn().mockReturnValue(null),
      getToolCallCommand: vi.fn().mockReturnValue(null),
      getMcpServerCommand: vi.fn().mockReturnValue(null),
      getMcpServers: vi.fn().mockReturnValue({}),
      getUserAgent: vi.fn().mockReturnValue('MockGeminiCLI/1.0.0'),
      getApprovalMode: vi.fn().mockReturnValue('APPROVE_ALL'),
      isVertexAI: vi.fn().mockReturnValue(false),
      getShowMemoryUsage: vi.fn().mockReturnValue(false),
      getAccessibilitySettings: vi.fn().mockReturnValue({
        screenReaderMode: false,
        highContrast: false,
      }),
    },

    // Additional methods found in implementation
    createLogger: vi.fn().mockReturnValue({
      log: vi.fn(),
      logMessage: vi.fn(),
      saveCheckpoint: vi.fn(),
      loadCheckpoint: vi.fn().mockResolvedValue([]),
    }),
  };

  // Deep merge function to combine defaults with overrides
  const merge = (target: any, source: any): any => {
    const output = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = output[key];

        if (
          Object.prototype.toString.call(sourceValue) === '[object Object]' &&
          Object.prototype.toString.call(targetValue) === '[object Object]'
        ) {
          output[key] = merge(targetValue, sourceValue);
        } else {
          output[key] = sourceValue;
        }
      }
    }
    return output;
  };

  return merge(defaultMocks, overrides);
};