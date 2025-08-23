/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Core, type ChatInput } from '@open-cli/core';

/**
 * Runs the CLI in non-interactive mode using the Core streaming interface
 * This replaces the complex CLIProvider-based implementation with a simple
 * Core-based approach that handles all orchestration internally.
 */
export async function runNonInteractive(
  core: Core,
  input: string,
  prompt_id: string,
): Promise<void> {
  // Handle EPIPE errors when output is piped to commands that close early
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') {
      process.exit(0);
    }
  });

  try {
    // Validate Core is ready
    if (!(await core.isReady())) {
      const status = await core.getInitializationStatus();
      console.error('Core not ready:');
      status.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    // Build chat input for Core
    const defaultProvider = await core.getDefaultProvider();
    const chatInput: ChatInput = {
      sessionID: prompt_id,
      parts: [{ type: 'text', text: input }],
      providerID: defaultProvider,
      modelID: 'default', // Core will use provider's default model
    };

    // Start streaming chat
    const stream = await core.chatStream(chatInput);
    let hasOutput = false;

    for await (const event of stream) {
      switch (event.type) {
        case 'text-delta':
          process.stdout.write(event.text);
          hasOutput = true;
          break;

        case 'tool-call':
          // Tools are executed internally by Core
          // We could optionally show tool execution progress here
          break;

        case 'tool-result':
          // Tool results are processed internally by Core
          break;

        case 'error':
          console.error(`\nError: ${event.error}`);
          process.exit(1);
          break;

        case 'finish':
          // Ensure final newline if we had output
          if (hasOutput) {
            process.stdout.write('\n');
          }
          return;

        default:
          // Handle any other event types gracefully
          break;
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
}