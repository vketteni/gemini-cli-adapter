/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Core provider interfaces
export * from './types.js';
export { AIProvider, AIProviderFactory } from './aiProvider.js';
export { AuthProvider, AuthProviderFactory, AuthType } from './authProvider.js';
export { ProviderRegistry, globalProviderRegistry } from './providerRegistry.js';

// Provider implementations
export * from './google/index.js';
export * from './openai/index.js';
// export * from './local/index.js';

// Setup utilities
export * from './setup.js';

// Phase 3: Dynamic loading and discovery
export * from './pluginLoader.js';
export * from './providerDiscovery.js';