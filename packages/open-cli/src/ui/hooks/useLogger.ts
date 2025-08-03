/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CLIProvider } from '@open-cli/interface';

/**
 * Hook to manage the logger instance using CLIProvider.
 */
export const useLogger = (adapter: CLIProvider) => {
  const [logger, setLogger] = useState<any | null>(null);

  useEffect(() => {
    const newLogger = adapter.settings.createLogger();
    /**
     * Start async initialization, no need to await. Using await slows down the
     * time from launch to see the gemini-cli prompt and it's better to not save
     * messages than for the cli to hanging waiting for the logger to loading.
     */
    newLogger
      .initialize()
      .then(() => {
        setLogger(newLogger);
      })
      .catch(() => {});
  }, [adapter]);

  return logger;
};
