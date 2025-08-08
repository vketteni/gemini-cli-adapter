/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * State management utilities inspired by OpenCode's patterns
 * Provides lazy initialization and caching for configuration and services
 */

type StateProvider<T> = () => Promise<T>;
type StateCache<T> = {
  promise?: Promise<T>;
  value?: T;
  error?: Error;
};

const stateCache = new Map<string, StateCache<any>>();

/**
 * Create a stateful service with lazy initialization
 * Inspired by OpenCode's App.state() pattern
 */
export function createState<T>(name: string, provider: StateProvider<T>) {
  return async (): Promise<T> => {
    let cache = stateCache.get(name);
    
    if (!cache) {
      cache = {};
      stateCache.set(name, cache);
    }

    // Return cached value if available
    if (cache.value !== undefined) {
      return cache.value;
    }

    // Return cached error if initialization failed
    if (cache.error) {
      throw cache.error;
    }

    // Return existing promise if initialization is in progress
    if (cache.promise) {
      return cache.promise;
    }

    // Start initialization
    cache.promise = provider()
      .then(value => {
        cache!.value = value;
        cache!.promise = undefined;
        return value;
      })
      .catch(error => {
        cache!.error = error;
        cache!.promise = undefined;
        throw error;
      });

    return cache.promise;
  };
}

/**
 * Clear cached state (useful for testing)
 */
export function clearState(name?: string): void {
  if (name) {
    stateCache.delete(name);
  } else {
    stateCache.clear();
  }
}

/**
 * Check if state is cached
 */
export function hasState(name: string): boolean {
  const cache = stateCache.get(name);
  return cache?.value !== undefined;
}