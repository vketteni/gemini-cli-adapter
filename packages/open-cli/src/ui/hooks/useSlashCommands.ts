/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { Core } from '@open-cli/core';
import { MessageContent, SlashCommandResult, UIMessage } from '../message.js';
import { LoadedSettings } from '../../config/settings.js';

interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[]) => Promise<SlashCommandResult>;
}

interface UseSlashCommandsReturn {
  handleSlashCommand: (input: string) => Promise<SlashCommandResult | false>;
  availableCommands: SlashCommand[];
  pendingMessages: MessageContent[];
  isProcessing: boolean;
}

/**
 * Clean slash command processor following OpenCode patterns
 * Replaces the complex legacy coreSlashCommandProcessor
 */
export const useSlashCommands = (
  core: Core,
  settings: LoadedSettings,
  addMessage: (message: MessageContent) => void,
  clearMessages: () => void,
  onShowHelp: () => void,
  onShowStats: () => void,
  onShowAbout: () => void,
): UseSlashCommandsReturn => {
  const [pendingMessages, setPendingMessages] = useState<MessageContent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Define available slash commands - OpenCode style
  const commands: SlashCommand[] = [
    {
      name: 'help',
      description: 'Show available commands',
      usage: '/help',
      handler: async () => {
        onShowHelp();
        return { type: 'handled' };
      },
    },
    {
      name: 'clear',
      description: 'Clear conversation history',
      usage: '/clear',
      handler: async () => {
        clearMessages();
        const infoMessage = UIMessage.InfoContent.parse({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'info',
          message: 'Conversation cleared',
        });
        addMessage(infoMessage);
        return { type: 'handled' };
      },
    },
    {
      name: 'stats',
      description: 'Show session statistics',
      usage: '/stats',
      handler: async () => {
        onShowStats();
        return { type: 'handled' };
      },
    },
    {
      name: 'about',
      description: 'Show CLI information',
      usage: '/about',
      handler: async () => {
        onShowAbout();
        return { type: 'handled' };
      },
    },
    {
      name: 'providers',
      description: 'List available AI providers',
      usage: '/providers',
      handler: async () => {
        try {
          const providers = await core.getAvailableProviders();
          const defaultProvider = await core.getDefaultProvider();
          
          const message = providers.length > 0
            ? `Available providers: ${providers.join(', ')}\nDefault: ${defaultProvider}`
            : 'No providers configured. Please set up API keys.';
          
          const infoMessage = UIMessage.InfoContent.parse({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'info',
            message,
          });
          addMessage(infoMessage);
        } catch (error) {
          const errorMessage = UIMessage.ErrorContent.parse({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'error',
            message: `Failed to get providers: ${error}`,
          });
          addMessage(errorMessage);
        }
        return { type: 'handled' };
      },
    },
    {
      name: 'tools',
      description: 'List available tools',
      usage: '/tools [provider] [model]',
      handler: async (args) => {
        try {
          const provider = args[0] || await core.getDefaultProvider();
          const model = args[1] || 'default';
          
          const tools = await core.getAvailableTools(provider, model);
          const message = tools.length > 0
            ? `Available tools for ${provider}/${model}: ${tools.map(t => t.name).join(', ')}`
            : `No tools available for ${provider}/${model}`;
          
          const infoMessage = UIMessage.InfoContent.parse({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'info',
            message,
          });
          addMessage(infoMessage);
        } catch (error) {
          const errorMessage = UIMessage.ErrorContent.parse({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'error',
            message: `Failed to get tools: ${error}`,
          });
          addMessage(errorMessage);
        }
        return { type: 'handled' };
      },
    },
  ];

  const handleSlashCommand = useCallback(
    async (input: string): Promise<SlashCommandResult | false> => {
      if (!input.startsWith('/')) return false;
      
      setIsProcessing(true);
      
      try {
        // Parse command and arguments
        const parts = input.slice(1).trim().split(/\s+/);
        const commandName = parts[0];
        const args = parts.slice(1);
        
        // Find matching command
        const command = commands.find(cmd => cmd.name === commandName);
        
        if (!command) {
          const errorMessage = UIMessage.ErrorContent.parse({
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'error',
            message: `Unknown command: /${commandName}. Type /help for available commands.`,
          });
          addMessage(errorMessage);
          return { type: 'handled' };
        }
        
        // Execute command
        const result = await command.handler(args);
        return result;
        
      } catch (error) {
        const errorMessage = UIMessage.ErrorContent.parse({
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'error',
          message: `Command failed: ${error instanceof Error ? error.message : String(error)}`,
        });
        addMessage(errorMessage);
        return { type: 'handled' };
        
      } finally {
        setIsProcessing(false);
      }
    },
    [commands, addMessage]
  );

  return {
    handleSlashCommand,
    availableCommands: commands,
    pendingMessages,
    isProcessing,
  };
};