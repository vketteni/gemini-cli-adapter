/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalProviderRegistry } from './providerRegistry.js';
import { GoogleAIProviderFactory, GoogleAuthProviderFactory } from './google/index.js';
import { OpenAIProviderFactory, OpenAIAuthProviderFactory } from './openai/index.js';

/**
 * Setup and register all built-in providers
 */
export function setupProviders(): void {
  // Register Google providers
  globalProviderRegistry.registerAIProvider('google', new GoogleAIProviderFactory());
  globalProviderRegistry.registerAuthProvider('google', new GoogleAuthProviderFactory());

  // Register OpenAI providers
  globalProviderRegistry.registerAIProvider('openai', new OpenAIProviderFactory());
  globalProviderRegistry.registerAuthProvider('openai', new OpenAIAuthProviderFactory());
}

/**
 * Get a configured provider registry with all built-in providers registered
 */
export function getConfiguredRegistry() {
  setupProviders();
  return globalProviderRegistry;
}

// Export the global registry for direct access
export { globalProviderRegistry };