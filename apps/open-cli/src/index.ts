#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore - TypeScript has issues with the relative import but runtime works
import { main } from '../../../packages/cli/dist/gemini.js';

// --- Global Entry Point ---
main().catch((error: Error) => {
  console.error('An unexpected critical error occurred:');
  if (error instanceof Error) {
    console.error(error.stack);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});