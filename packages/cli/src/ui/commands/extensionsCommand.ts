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

export const extensionsCommand: SlashCommand = {
  name: 'extensions',
  description: 'list active extensions',
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext): Promise<void> => {
    // TODO: Add getExtensions method to SettingsService
    const config = context.services.adapter && (context.services.adapter as any).config;
    const activeExtensions = config
      ?.getExtensions()
      .filter((ext: any) => ext.isActive);
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
      (ext) => `  - \u001b[36m${ext.name} (v${ext.version})\u001b[0m`,
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
