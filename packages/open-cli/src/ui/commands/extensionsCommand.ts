/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type CommandContext,
  type SlashCommand,
  CommandKind,
} from './types.js';
import { MessageType } from '../types.js';
import { type Extension } from '../../config/extension.js';
import { GeminiCLIExtension } from '@gemini-cli-adapter/core-interface';

export const extensionsCommand: SlashCommand = {
  name: 'extensions',
  description: 'list active extensions',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext): Promise<void> => {
    if (!context.services.adapter) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: 'Adapter not available.',
        },
        Date.now(),
      );
      return;
    }
    
    const activeExtensions = context.services.adapter.settings
      .getExtensions()
      .filter((ext: GeminiCLIExtension) => ext.isActive);
    if (!activeExtensions || activeExtensions.length === 0) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: 'No active extensions.',
        },
        Date.now(),
      );
      return;
    }

    const extensionLines = activeExtensions.map(
      (ext: GeminiCLIExtension) => `  - \u001b[36m${ext.name} (v${ext.version})\u001b[0m`,
    );
    const message = `Active extensions:\n\n${extensionLines.join('\n')}\n`;

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: message,
      },
      Date.now(),
    );
  },
};
