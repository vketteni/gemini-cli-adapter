
import { Config } from '@google/gemini-cli-core';
import { GoogleAdapter } from '@open-cli/gemini-cli-core-shim';
import { CoreAdapter, LoadedSettings } from '@open-cli/interface';

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
const ADAPTER_REGISTRY = new Map<AdapterType, (config: Config, settings: LoadedSettings) => Promise<CoreAdapter>>([
  [AdapterType.GOOGLE, (config: Config, settings: LoadedSettings) => GoogleAdapter.create(config, settings)],
  // Future adapters can be registered here
  // [AdapterType.OPENAI, (config: Config, settings: LoadedSettings) => OpenAIAdapter.create(config, settings)],
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
 * Factory function to create a CoreAdapter instance from a Config object and LoadedSettings.
 * This is now async to support adapters that require async setup.
 */
export async function createAdapterFromConfig(config: Config, settings: LoadedSettings): Promise<CoreAdapter> {
  const adapterType = getAdapterType();
  const adapterFactory = ADAPTER_REGISTRY.get(adapterType);

  if (!adapterFactory) {
    throw new Error(`Unsupported adapter type: ${adapterType}. Available types: ${Array.from(ADAPTER_REGISTRY.keys()).join(', ')}`);
  }

  return await adapterFactory(config, settings);
}

/**
 * Creates the default Google adapter for the CLI.
 */
export async function createGoogleAdapter(config: Config, settings: LoadedSettings): Promise<GoogleAdapter> {
  return await GoogleAdapter.create(config, settings);
}

/**
 * Registers a new adapter type in the factory.
 */
export function registerAdapter(
  type: AdapterType,
  constructor: (config: Config, settings: LoadedSettings) => Promise<CoreAdapter>
): void {
  ADAPTER_REGISTRY.set(type, constructor);
}

/**
 * Gets all available adapter types.
 */
export function getAvailableAdapterTypes(): AdapterType[] {
  return Array.from(ADAPTER_REGISTRY.keys());
}
