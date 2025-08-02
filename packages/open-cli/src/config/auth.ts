/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreAdapter } from '@open-cli/interface';

export const validateAuthMethod = (adapter: CoreAdapter, authMethod: string): string | null => {
  adapter.settings.loadEnvironment();
  return adapter.auth.validateAuthMethod(authMethod);
};
