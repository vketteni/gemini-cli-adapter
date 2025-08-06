/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalProviderRegistry } from './providerRegistry.js';
import { GoogleAIProviderFactory } from './google/googleAIProviderFactory.js';
import { OpenAIProviderFactory } from './openai/openaiAIProviderFactory.js';

/**
 * Initialize default providers in the global registry
 */
function initializeDefaultProviders() {
  // Register Google provider
  try {
    globalProviderRegistry.registerAIProvider('google', new GoogleAIProviderFactory());
  } catch (error) {
    console.warn('Failed to register Google provider:', error);
  }

  // Register OpenAI provider
  try {
    globalProviderRegistry.registerAIProvider('openai', new OpenAIProviderFactory());
  } catch (error) {
    console.warn('Failed to register OpenAI provider:', error);
  }
}

// Initialize providers when this module is loaded
initializeDefaultProviders();

export { initializeDefaultProviders };