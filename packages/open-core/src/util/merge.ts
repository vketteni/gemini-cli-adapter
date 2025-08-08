/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Deep merge utility inspired by OpenCode's mergeDeep from Remeda
 * Handles configuration object merging with proper type safety
 */

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deeply merge multiple objects, with later objects taking precedence
 * Arrays are replaced, not merged
 */
export function mergeDeep<T extends Record<string, any>>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  if (!sources.length) return target;
  
  const result = { ...target };
  
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    
    for (const key in source) {
      if (!(key in source)) continue;
      
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (sourceValue === undefined) continue;
      
      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = mergeDeep(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as any;
      }
    }
  }
  
  return result;
}

/**
 * Check if a value is a plain object (not an array, function, etc.)
 */
function isPlainObject(value: any): value is Record<string, any> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  // Check for array
  if (Array.isArray(value)) {
    return false;
  }
  
  // Check for class instances, Maps, Sets, etc.
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Create a deep partial version of an object
 */
export function createPartial<T extends Record<string, any>>(
  obj: T,
  paths: string[] = []
): DeepPartial<T> {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isPlainObject(value)) {
      result[key] = createPartial(value, [...paths, key]);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}