/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { Core } from '@open-cli/core';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { validateApiKeys, getAvailableProviders } from '../../config/coreConfig.js';

export type CoreAuthProvider = 'anthropic' | 'openai' | 'google';

/**
 * Core-based authentication hook
 * Simplified authentication that works with API keys instead of OAuth flows
 */
export const useCoreAuthCommand = (
  core: Core,
  settings: LoadedSettings,
  setAuthError: (error: string | null) => void,
) => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('anthropic');

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true);
  }, []);

  // Check API key configuration on mount
  useEffect(() => {
    const checkAuth = async () => {
      const validation = validateApiKeys();
      const providers = getAvailableProviders();
      
      setAvailableProviders(providers);
      
      if (!validation.valid) {
        setAuthError(
          `Missing API keys: ${validation.missing.join(', ')}\n\n` +
          'Please set environment variables:\n' +
          '• ANTHROPIC_API_KEY for Claude models\n' +
          '• OPENAI_API_KEY for GPT models\n' +
          '• GEMINI_API_KEY for Gemini models'
        );
        setIsAuthDialogOpen(true);
        return;
      }

      // Try to get current provider
      try {
        const defaultProvider = await core.getDefaultProvider();
        setCurrentProvider(defaultProvider);
        setAuthError(null);
      } catch (error) {
        setAuthError(`Failed to initialize provider: ${error instanceof Error ? error.message : String(error)}`);
        setIsAuthDialogOpen(true);
      }
    };

    checkAuth();
  }, [core, setAuthError]);

  const handleProviderSelect = useCallback(
    async (provider: CoreAuthProvider, scope: SettingScope) => {
      setIsAuthenticating(true);
      
      try {
        // Validate that the selected provider has an API key
        const providers = getAvailableProviders();
        
        if (!providers.includes(provider)) {
          let envVar: string;
          switch (provider) {
            case 'anthropic':
              envVar = 'ANTHROPIC_API_KEY';
              break;
            case 'openai':
              envVar = 'OPENAI_API_KEY';
              break;
            case 'google':
              envVar = 'GEMINI_API_KEY';
              break;
            default:
              envVar = 'API_KEY';
          }
          
          throw new Error(`No API key found for ${provider}. Please set the ${envVar} environment variable.`);
        }

        // Save preferred provider to settings
        settings.setValue(scope, 'preferredProvider', provider);
        setCurrentProvider(provider);
        
        // Test the provider by getting available providers from Core
        await core.getAvailableProviders();
        
        setIsAuthDialogOpen(false);
        setAuthError(null);
        
        console.log(`Successfully configured ${provider} provider.`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setAuthError(`Failed to configure ${provider} provider: ${errorMessage}`);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [core, settings, setAuthError]
  );

  const cancelAuthentication = useCallback(() => {
    setIsAuthenticating(false);
    setIsAuthDialogOpen(false);
  }, []);

  const refreshProviders = useCallback(async () => {
    try {
      const providers = getAvailableProviders();
      setAvailableProviders(providers);
      
      if (providers.length === 0) {
        setAuthError(
          'No API keys configured. Please set at least one of:\n' +
          '• ANTHROPIC_API_KEY\n• OPENAI_API_KEY\n• GEMINI_API_KEY'
        );
        setIsAuthDialogOpen(true);
      } else {
        setAuthError(null);
      }
    } catch (error) {
      setAuthError(`Failed to refresh providers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [setAuthError]);

  return {
    isAuthDialogOpen,
    openAuthDialog,
    handleAuthSelect: handleProviderSelect,
    isAuthenticating,
    cancelAuthentication,
    availableProviders,
    currentProvider,
    refreshProviders,
  };
};