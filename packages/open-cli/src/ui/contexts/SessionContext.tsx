/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useMemo,
  useEffect,
} from 'react';

import { Core } from '@open-cli/core';

// Simplified metrics interfaces for Core integration
export interface SessionMetrics {
  totalRequests: number;
  totalTokens: number;
  totalTime: number;
  errorCount: number;
}

export interface ModelMetrics {
  modelName: string;
  requestCount: number;
  tokenCount: number;
  avgResponseTime: number;
}

// --- Interface Definitions ---

export interface SessionStatsState {
  sessionStartTime: Date;
  metrics: SessionMetrics;
  lastPromptTokenCount: number;
  promptCount: number;
}

export interface ComputedSessionStats {
  totalApiTime: number;
  totalToolTime: number;
  agentActiveTime: number;
  apiTimePercent: number;
  toolTimePercent: number;
  cacheEfficiency: number;
  totalDecisions: number;
  successRate: number;
  agreementRate: number;
  totalCachedTokens: number;
  totalPromptTokens: number;
}

// Defines the final "value" of our context, including the state
// and the functions to update it.
interface SessionStatsContextValue {
  stats: SessionStatsState;
  startNewPrompt: () => void;
  getPromptCount: () => number;
}

// --- Context Definition ---

const SessionStatsContext = createContext<SessionStatsContextValue | undefined>(
  undefined,
);

// --- Provider Component ---

export const SessionStatsProvider: React.FC<{ 
  children: React.ReactNode;
  core?: Core;
}> = ({ children, core }) => {
  const [stats, setStats] = useState<SessionStatsState>({
    sessionStartTime: new Date(),
    metrics: {
      totalRequests: 0,
      totalTokens: 0,
      totalTime: 0,
      errorCount: 0,
    },
    lastPromptTokenCount: 0,
    promptCount: 0,
  });

  useEffect(() => {
    // TODO: Integrate with Core's session metrics when available
    // For now, we maintain basic session stats locally
    if (!core) return;
    
    // This would integrate with Core's session management system
    // const sessionInfo = await core.getSession('main-session');
    // Update metrics based on Core's session data
  }, [core]);

  const startNewPrompt = useCallback(() => {
    setStats((prevState) => ({
      ...prevState,
      promptCount: prevState.promptCount + 1,
    }));
  }, []);

  const getPromptCount = useCallback(
    () => stats.promptCount,
    [stats.promptCount],
  );

  const value = useMemo(
    () => ({
      stats,
      startNewPrompt,
      getPromptCount,
    }),
    [stats, startNewPrompt, getPromptCount],
  );

  return (
    <SessionStatsContext.Provider value={value}>
      {children}
    </SessionStatsContext.Provider>
  );
};

// --- Consumer Hook ---

export const useSessionStats = () => {
  const context = useContext(SessionStatsContext);
  if (context === undefined) {
    throw new Error(
      'useSessionStats must be used within a SessionStatsProvider',
    );
  }
  return context;
};
