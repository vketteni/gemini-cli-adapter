#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import './dist/main.js';
export { main } from './dist/main.js';

// Export settings types and utilities for external packages
export { LoadedSettings, SettingScope, Settings } from './dist/config/settings.js';

// Re-export Core types for external packages
export type { Core, CoreConfig, ChatInput, ChatResponse, StreamEvent } from '@open-cli/core';