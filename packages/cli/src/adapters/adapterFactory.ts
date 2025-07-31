/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config } from '@google/gemini-cli-core';
import { GoogleAdapter } from '@gemini-cli/gemini-cli-core-shim';
import { CoreAdapter } from '@gemini-cli/core-interface';

/**
 * Factory function to create a CoreAdapter instance from a Config object.
 * This serves as the bridge between the legacy Config-based system and the new adapter-based system.
 */
export function createAdapterFromConfig(config: Config): CoreAdapter {
  return new GoogleAdapter(config);
}

/**
 * Creates the default Google adapter for the CLI.
 * This is the primary adapter used by the Gemini CLI.
 */
export function createGoogleAdapter(config: Config): GoogleAdapter {
  return new GoogleAdapter(config);
}