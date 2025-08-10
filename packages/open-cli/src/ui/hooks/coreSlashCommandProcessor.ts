/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useMemo } from 'react';
import { Core } from '@open-cli/core';
import { LoadedSettings } from '../../config/settings.js';
import { UseHistoryManagerReturn } from './useHistoryManager.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import {
  MessageType,
  HistoryItem,
  SlashCommandProcessorResult,
} from '../types.js';
import {
  CoreCommandContext,
  CoreSlashCommand,
  CoreSlashCommandProcessorResult,
} from '../commands/coreTypes.js';

/**
 * Core-based slash command processor hook
 * Simplified version that works directly with Core instead of adapter pattern
 */
export const useCoreSlashCommandProcessor = (
  core: Core,
  settings: LoadedSettings,
  selectedProvider: string,
  selectedModel: string,
  addItem: UseHistoryManagerReturn['addItem'],
  clearItems: UseHistoryManagerReturn['clearItems'],
  refreshStatic: () => void,
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>,
  onDebugMessage: (message: string) => void,
  openThemeDialog: () => void,
  openAuthDialog: () => void,
  openEditorDialog: () => void,
  toggleCorgiMode: () => void,
  setQuittingMessages: (messages: HistoryItem[]) => void,
  openPrivacyNotice: () => void,
  toggleVimEnabled: () => Promise<boolean>,
  setIsProcessing: (isProcessing: boolean) => void,
) => {
  const sessionStats = useSessionStats();
  const [pendingItem, setPendingItem] = useState<any>(null);

  // Build the Core command context
  const commandContext: CoreCommandContext = useMemo(() => ({
    services: {
      core,
      settings,
      workingDirectory: process.cwd(),
      selectedProvider,
      selectedModel,
    },
    ui: {
      addItem,
      clear: () => {
        clearItems();
        refreshStatic();
      },
      setDebugMessage: onDebugMessage,
      pendingItem,
      setPendingItem,
      refreshStatic,
      openThemeDialog,
      openAuthDialog,
      openEditorDialog,
      toggleCorgiMode,
      setQuittingMessages,
      openPrivacyNotice,
      toggleVimEnabled,
    },
    session: {
      stats: sessionStats.stats,
      sessionId: 'main-session', // TODO: Get from Core
      startTime: sessionStats.stats.sessionStartTime,
    },
  }), [
    core, settings, selectedProvider, selectedModel,
    addItem, clearItems, refreshStatic, onDebugMessage,
    pendingItem, openThemeDialog, openAuthDialog, openEditorDialog,
    toggleCorgiMode, setQuittingMessages, openPrivacyNotice, toggleVimEnabled,
    sessionStats
  ]);

  // Define core slash commands
  const commands: CoreSlashCommand[] = useMemo(() => [
    {
      name: 'help',
      altNames: ['h', '?'],
      description: 'Show available commands',
      action: async (context) => {
        setShowHelp(true);
      },
    },
    {
      name: 'clear',
      altNames: ['c'],
      description: 'Clear the conversation history',
      action: async (context) => {
        context.ui.clear();
        context.ui.addItem({
          type: MessageType.INFO,
          text: 'Conversation history cleared.',
        }, Date.now());
      },
    },
    {
      name: 'tools',
      description: 'Show available tools',
      action: async (context) => {
        try {
          const tools = await context.services.core.getAvailableTools(
            context.services.selectedProvider,
            context.services.selectedModel
          );
          
          const toolsList = tools.map(tool => `• ${tool.name}: ${tool.description}`).join('\n');
          
          context.ui.addItem({
            type: MessageType.INFO,
            text: `Available tools:\n${toolsList}`,
          }, Date.now());
        } catch (error) {
          context.ui.addItem({
            type: MessageType.ERROR,
            text: `Failed to get tools: ${error instanceof Error ? error.message : String(error)}`,
          }, Date.now());
        }
      },
    },
    {
      name: 'memory',
      description: 'Session memory commands',
      subCommands: [
        {
          name: 'compress',
          description: 'Compress current session',
          action: async (context) => {
            try {
              await context.services.core.compressSession(context.session.sessionId);
              context.ui.addItem({
                type: MessageType.INFO,
                text: 'Session compressed successfully.',
              }, Date.now());
            } catch (error) {
              context.ui.addItem({
                type: MessageType.ERROR,
                text: `Failed to compress session: ${error instanceof Error ? error.message : String(error)}`,
              }, Date.now());
            }
          },
        },
        {
          name: 'revert',
          description: 'Revert session to previous state',
          action: async (context) => {
            const args = context.invocation?.args?.trim();
            if (!args) {
              context.ui.addItem({
                type: MessageType.ERROR,
                text: 'Please specify a message ID to revert to: /memory revert <messageId>',
              }, Date.now());
              return;
            }
            
            try {
              await context.services.core.revertSession(context.session.sessionId, args);
              context.ui.addItem({
                type: MessageType.INFO,
                text: `Session reverted to message ${args}.`,
              }, Date.now());
            } catch (error) {
              context.ui.addItem({
                type: MessageType.ERROR,
                text: `Failed to revert session: ${error instanceof Error ? error.message : String(error)}`,
              }, Date.now());
            }
          },
        },
      ],
    },
    {
      name: 'theme',
      description: 'Open theme selection dialog',
      action: async (context) => {
        context.ui.openThemeDialog();
      },
    },
    {
      name: 'auth',
      description: 'Open authentication dialog',
      action: async (context) => {
        context.ui.openAuthDialog();
      },
    },
    {
      name: 'editor',
      description: 'Open editor settings dialog',
      action: async (context) => {
        context.ui.openEditorDialog();
      },
    },
    {
      name: 'vim',
      description: 'Toggle vim mode',
      action: async (context) => {
        const newValue = await context.ui.toggleVimEnabled();
        context.ui.addItem({
          type: MessageType.INFO,
          text: `Vim mode ${newValue ? 'enabled' : 'disabled'}.`,
        }, Date.now());
      },
    },
    {
      name: 'privacy',
      description: 'Show privacy notice',
      action: async (context) => {
        context.ui.openPrivacyNotice();
      },
    },
    {
      name: 'quit',
      altNames: ['exit', 'q'],
      description: 'Exit the application',
      action: async (context) => {
        context.ui.addItem({
          type: MessageType.INFO,
          text: 'Goodbye!',
        }, Date.now());
        
        // Set quitting message and exit
        context.ui.setQuittingMessages([{
          id: Date.now(),
          type: MessageType.INFO,
          text: 'Goodbye!',
          timestamp: Date.now(),
        }]);
        
        setTimeout(() => process.exit(0), 1000);
      },
    },
  ], [setShowHelp]);

  const handleSlashCommand = useCallback(
    async (input: string): Promise<SlashCommandProcessorResult | false> => {
      setIsProcessing(true);
      
      try {
        const trimmed = input.trim();
        if (!trimmed.startsWith('/')) {
          return false;
        }

        // Add user message to history
        const userMessageTimestamp = Date.now();
        addItem(
          { type: MessageType.USER, text: trimmed },
          userMessageTimestamp,
        );

        // Parse command
        const parts = trimmed.substring(1).trim().split(/\s+/);
        const commandPath = parts.filter((p) => p);

        if (commandPath.length === 0) {
          setShowHelp(true);
          return { type: 'success' };
        }

        // Find command
        let currentCommands = commands;
        let commandToExecute: CoreSlashCommand | undefined;
        let pathIndex = 0;

        for (const part of commandPath) {
          const foundCommand = currentCommands.find(
            (cmd) => cmd.name === part || cmd.altNames?.includes(part)
          );

          if (foundCommand) {
            commandToExecute = foundCommand;
            pathIndex++;
            if (foundCommand.subCommands) {
              currentCommands = foundCommand.subCommands;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        if (commandToExecute && commandToExecute.action) {
          const args = parts.slice(pathIndex).join(' ');
          const contextWithInvocation: CoreCommandContext = {
            ...commandContext,
            invocation: {
              raw: trimmed,
              name: commandToExecute.name,
              args,
            },
          };

          await commandToExecute.action(contextWithInvocation);
          return { type: 'success' };
        } else {
          addItem({
            type: MessageType.ERROR,
            text: `Unknown command: ${commandPath.join(' ')}\nType /help to see available commands.`,
          }, Date.now());
          return { type: 'error', message: 'Unknown command' };
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        addItem({
          type: MessageType.ERROR,
          text: `Command failed: ${errorMessage}`,
        }, Date.now());
        return { type: 'error', message: errorMessage };
      } finally {
        setIsProcessing(false);
      }
    },
    [commands, commandContext, addItem, setIsProcessing, setShowHelp]
  );

  return {
    handleSlashCommand,
    slashCommands: commands,
    pendingHistoryItems: [], // TODO: Implement if needed
    commandContext,
    shellConfirmationRequest: null, // TODO: Implement shell confirmation
  };
};