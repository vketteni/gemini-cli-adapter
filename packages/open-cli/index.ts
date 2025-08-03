#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import './dist/gemini.js';
export { main } from './dist/gemini.js';

// Export settings types and utilities for external packages
export { LoadedSettings, SettingScope, Settings } from './dist/config/settings.js';