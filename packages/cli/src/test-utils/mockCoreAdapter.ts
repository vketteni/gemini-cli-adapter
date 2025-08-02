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
    isTelemetryInitialized: vi.fn().mockReturnValue(false),
    shutdownTelemetry: vi.fn().mockResolvedValue(undefined),

    // Chat Service
    chat: {
      sendMessageStream: vi.fn().mockReturnValue(async function* () {
        yield { type: 'content', text: 'Mock response' };
      }),
      getHistory: vi.fn().mockResolvedValue([]),
      setHistory: vi.fn().mockResolvedValue(undefined),
      resetChat: vi.fn().mockResolvedValue(undefined),
      tryCompressChat: vi.fn().mockResolvedValue({ compressed: false }),
		setTools: vi.fn(),
		addHistory: vi.fn(),
    //   getCompressionMetadata: vi.fn().mockReturnValue({
    //     lastCompressionAttempt: null,
    //     totalCompressions: 0,
    //   }),
    },

    // Tooling Service
    tools: {
      getTool: vi.fn().mockReturnValue(null),
      getAllTools: vi.fn().mockReturnValue([]),
      executeToolCall: vi.fn().mockResolvedValue({
        status: 'success',
        result: { output: 'Mock tool result' },
      }),
      checkCommandPermissions: vi.fn().mockResolvedValue(true),
      getFunctionDeclarations: vi.fn().mockResolvedValue([]),
      getToolRegistry: vi.fn().mockReturnValue({
        getTool: vi.fn(),
        getAllTools: vi.fn().mockReturnValue([]),
        discoverMcpTools: vi.fn().mockResolvedValue([]),
        discoverToolsForServer: vi.fn().mockResolvedValue([]),
      }),
      getShellExecutionService: vi.fn().mockReturnValue({
        executeCommand: vi.fn().mockResolvedValue({
          stdout: 'Mock command output',
          stderr: '',
          exitCode: 0,
        }),
        checkCommandPermissions: vi.fn().mockResolvedValue(true),
      }),
      getPromptRegistry: vi.fn().mockResolvedValue({}),
      getIdeClient: vi.fn().mockReturnValue(null),
      createCoreToolScheduler: vi.fn().mockReturnValue({
        scheduleToolCall: vi.fn(),
        cancel: vi.fn(),
      }),
    },

    // Workspace Service
    workspace: {
      shouldIgnoreFile: vi.fn().mockResolvedValue(false),
      getProjectTempDir: vi.fn().mockReturnValue('/mock/project/.tmp'),
      isGitRepository: vi.fn().mockResolvedValue(true),
      getFileDiscoveryService: vi.fn().mockReturnValue({
        shouldIgnoreFile: vi.fn().mockReturnValue(false),
        discoverFiles: vi.fn().mockResolvedValue([]),
      }),
      getProjectRoot: vi.fn().mockReturnValue('/mock/project'),
    },

    // Auth Service
    auth: {
      refreshAuth: vi.fn().mockResolvedValue(undefined),
      clearCachedCredentialFile: vi.fn().mockResolvedValue(undefined),
      getAuthType: vi.fn().mockReturnValue('LOGIN_WITH_GOOGLE'),
      isBrowserLaunchSuppressed: vi.fn().mockReturnValue(false),
      validateAuthMethod: vi.fn().mockReturnValue(null),
      getCodeAssistServer: vi.fn().mockReturnValue(null),
      mcpServerRequiresOAuth: vi.fn().mockReturnValue(false),
      getMCPOAuthProvider: vi.fn().mockReturnValue(null),
    },

    // Memory Service
    memory: {
      loadHierarchicalMemory: vi.fn().mockResolvedValue(undefined),
      setUserMemory: vi.fn().mockResolvedValue(undefined),
      getUserMemory: vi.fn().mockReturnValue('Mock user memory'),
      getGeminiMdFileCount: vi.fn().mockReturnValue(0),
      setGeminiMdFileCount: vi.fn().mockResolvedValue(undefined),
    },

    // Settings Service
    settings: {
      getApprovalMode: vi.fn().mockReturnValue('default'),
      setApprovalMode: vi.fn().mockResolvedValue(undefined),
      getProjectRoot: vi.fn().mockReturnValue('/mock/project'),
      getSessionId: vi.fn().mockReturnValue('mock-session-id'),
      getModel: vi.fn().mockReturnValue('gemini-1.5-pro'),
      getDefaultModel: vi.fn().mockReturnValue('gemini-1.5-pro'),
      getDefaultEmbeddingModel: vi.fn().mockReturnValue('text-embedding-004'),
      getMaxSessionTurns: vi.fn().mockReturnValue(50),
      createLogger: vi.fn().mockReturnValue({
        log: vi.fn(),
        logMessage: vi.fn(),
        saveCheckpoint: vi.fn(),
        loadCheckpoint: vi.fn().mockResolvedValue([]),
      }),
      getProjectTempDir: vi.fn().mockReturnValue('/mock/project/.tmp'),
      getCheckpointingEnabled: vi.fn().mockReturnValue(false),
      setQuotaErrorOccurred: vi.fn().mockResolvedValue(undefined),
      getContentGeneratorConfig: vi.fn().mockReturnValue({}),
      getSandboxConfig: vi.fn().mockReturnValue({
        enabled: false,
        allowedCommands: [],
        blockedCommands: [],
      }),
      loadEnvironment: vi.fn().mockResolvedValue(undefined),
      getMcpServers: vi.fn().mockReturnValue({}),
      getAuthType: vi.fn().mockReturnValue('LOGIN_WITH_GOOGLE'),
      getBlockedMcpServers: vi.fn().mockReturnValue([]),
      getExtensions: vi.fn().mockReturnValue([]),
      getIdeMode: vi.fn().mockReturnValue(false),
      getIdeClient: vi.fn().mockReturnValue(null),
      getEnableRecursiveFileSearch: vi.fn().mockReturnValue(true),
      getFileFilteringOptions: vi.fn().mockReturnValue({
        include: [],
        exclude: [],
        maxFiles: 100,
      }),
      getDebugMode: vi.fn().mockReturnValue(false),
      getListExtensions: vi.fn().mockReturnValue(false),
      getExperimentalAcp: vi.fn().mockReturnValue(false),
      getQuestion: vi.fn().mockReturnValue(''),
    },
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