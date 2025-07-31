/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CoreAdapter } from '@gemini-cli-adapter/core-interface';

/**
 * Hook to manage the logger instance using CoreAdapter.
 */
export const useLogger = (adapter: CoreAdapter) => {
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
