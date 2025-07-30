/**
 * Hook for adapter management
 */

import { useState, useEffect } from 'react';
import { CoreAdapter } from '@ai-cli-adapter/core-interface';

export const useAdapter = (adapter: CoreAdapter) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await adapter.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initialize();

    return () => {
      adapter.dispose().catch(console.error);
    };
  }, [adapter]);

  return { isInitialized, error };
};