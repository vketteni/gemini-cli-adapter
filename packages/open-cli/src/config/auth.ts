/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CLIProvider } from '@open-cli/interface';

export const validateAuthMethod = (adapter: CLIProvider, authMethod: string): string | null => {
  adapter.settings.loadEnvironment();
  return adapter.auth.validateAuthMethod(authMethod);
};
