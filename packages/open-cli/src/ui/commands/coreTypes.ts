/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Core } from '@open-cli/core';
import { HistoryItemWithoutId } from '../types.js';
import { LoadedSettings } from '../../config/settings.js';
import { UseHistoryManagerReturn } from '../hooks/useHistoryManager.js';
import type { HistoryItem } from '../types.js';
import { SessionStatsState } from '../contexts/SessionContext.js';

/**
 * Core-based Command Context for the new architecture
 * Replaces the adapter-based CommandContext with direct Core integration
 */
export interface CoreCommandContext {
  // Invocation properties for when commands are called.
  invocation?: {
    /** The raw, untrimmed input string from the user. */
    raw: string;
    /** The primary name of the command that was matched. */
    name: string;
    /** The arguments string that follows the command name. */
    args: string;
  };
  
  // Core services and configuration
  services: {
    /** Direct Core instance for all AI operations */
    core: Core;
    /** User settings and configuration */
    settings: LoadedSettings;
    /** Current working directory */
    workingDirectory: string;
    /** Selected provider (anthropic, openai, google) */
    selectedProvider: string;
    /** Selected model for the current provider */
    selectedModel: string;
  };
  
  // UI state and history management
  ui: {
    /** Adds a new item to the history display. */
    addItem: UseHistoryManagerReturn['addItem'];
    /** Clears all history items and the console screen. */
    clear: () => void;
    /** Sets the transient debug message displayed in the application footer in debug mode. */
    setDebugMessage: (message: string) => void;
    /** The currently pending history item, if any. */
    pendingItem: HistoryItemWithoutId | null;
    /** Sets a pending item in the history for long-running operations. */
    setPendingItem: (item: HistoryItemWithoutId | null) => void;
    /** Refreshes static content display */
    refreshStatic: () => void;
    /** Opens the theme selection dialog */
    openThemeDialog: () => void;
    /** Opens the authentication dialog */
    openAuthDialog: () => void;
    /** Opens the editor settings dialog */
    openEditorDialog: () => void;
    /** Toggles corgi mode on/off */
    toggleCorgiMode: () => void;
    /** Sets quitting messages for graceful shutdown */
    setQuittingMessages: (messages: HistoryItem[]) => void;
    /** Opens the privacy notice */
    openPrivacyNotice: () => void;
    /** Toggles vim mode on/off */
    toggleVimEnabled: () => Promise<boolean>;
  };
  
  // Session management
  session: {
    /** Session statistics */
    stats: SessionStatsState;
    /** Current session ID */
    sessionId: string;
    /** Session start time */
    startTime: Date;
  };
}

/**
 * Core-based Slash Command interface
 * Simplified command definition for Core architecture
 */
export interface CoreSlashCommand {
  /** Primary command name (e.g., 'help', 'tools') */
  name: string;
  /** Alternative names/aliases for this command */
  altNames?: string[];
  /** Brief description of what this command does */
  description: string;
  /** Detailed usage information */
  usage?: string;
  /** Sub-commands if this is a parent command */
  subCommands?: CoreSlashCommand[];
  /** The action to execute when this command is invoked */
  action?: (context: CoreCommandContext) => Promise<void>;
  /** Whether this command is available in the current context */
  isAvailable?: (context: CoreCommandContext) => boolean;
}

/**
 * Result of processing a slash command
 */
export interface CoreSlashCommandProcessorResult {
  /** Whether the command was successfully processed */
  success: boolean;
  /** Optional message to display to the user */
  message?: string;
  /** Whether to continue processing additional commands */
  continue?: boolean;
}