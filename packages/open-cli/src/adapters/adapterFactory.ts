
import { Config } from '@google/gemini-cli-core';
import { GoogleAdapter } from '@gemini-cli-adapter/gemini-cli-core-shim';
import { CoreAdapter } from '@gemini-cli-adapter/core-interface';

/**
 * Supported adapter types for the CLI
 */
export enum AdapterType {
  GOOGLE = 'google',
  MOCK = 'mock',
}

/**
 * Registry of available adapter *factories* (now async)
 */
const ADAPTER_REGISTRY = new Map<AdapterType, (config: Config) => Promise<CoreAdapter>>([
  [AdapterType.GOOGLE, (config: Config) => GoogleAdapter.create(config)],
  // Future adapters can be registered here
  // [AdapterType.OPENAI, (config: Config) => OpenAIAdapter.create(config)],
]);

/**
 * Determines the adapter type to use based on environment and settings
 */
function getAdapterType(): AdapterType {
  const envAdapterType = process.env.GEMINI_ADAPTER_TYPE?.toLowerCase();
  if (envAdapterType && Object.values(AdapterType).includes(envAdapterType as AdapterType)) {
    return envAdapterType as AdapterType;
  }

  return AdapterType.GOOGLE;
}

/**
 * Factory function to create a CoreAdapter instance from a Config object.
 * This is now async to support adapters that require async setup.
 */
export async function createAdapterFromConfig(config: Config): Promise<CoreAdapter> {
  const adapterType = getAdapterType();
  const adapterFactory = ADAPTER_REGISTRY.get(adapterType);

  if (!adapterFactory) {
    throw new Error(`Unsupported adapter type: ${adapterType}. Available types: ${Array.from(ADAPTER_REGISTRY.keys()).join(', ')}`);
  }

  return await adapterFactory(config);
}

/**
 * Creates the default Google adapter for the CLI.
 */
export async function createGoogleAdapter(config: Config): Promise<GoogleAdapter> {
  return await GoogleAdapter.create(config);
}

/**
 * Registers a new adapter type in the factory.
 */
export function registerAdapter(
  type: AdapterType,
  constructor: (config: Config) => Promise<CoreAdapter>
): void {
  ADAPTER_REGISTRY.set(type, constructor);
}

/**
 * Gets all available adapter types.
 */
export function getAvailableAdapterTypes(): AdapterType[] {
  return Array.from(ADAPTER_REGISTRY.keys());
}
