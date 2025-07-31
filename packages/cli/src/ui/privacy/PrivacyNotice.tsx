/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from 'ink';
import { AuthType } from '@google/gemini-cli-core';
import { CoreAdapter } from '@gemini-cli/core-interface';
import { GeminiPrivacyNotice } from './GeminiPrivacyNotice.js';
import { CloudPaidPrivacyNotice } from './CloudPaidPrivacyNotice.js';
import { CloudFreePrivacyNotice } from './CloudFreePrivacyNotice.js';

interface PrivacyNoticeProps {
  onExit: () => void;
  adapter: CoreAdapter;
}

const PrivacyNoticeText = ({
  adapter,
  onExit,
}: {
  adapter: CoreAdapter;
  onExit: () => void;
}) => {
  const authType = adapter.settings.getContentGeneratorConfig()?.authType;

  switch (authType) {
    case AuthType.USE_GEMINI:
      return <GeminiPrivacyNotice onExit={onExit} />;
    case AuthType.USE_VERTEX_AI:
      return <CloudPaidPrivacyNotice onExit={onExit} />;
    case AuthType.LOGIN_WITH_GOOGLE:
    default:
      return <CloudFreePrivacyNotice adapter={adapter} onExit={onExit} />;
  }
};

export const PrivacyNotice = ({ onExit, adapter }: PrivacyNoticeProps) => (
  <Box borderStyle="round" padding={1} flexDirection="column">
    <PrivacyNoticeText adapter={adapter} onExit={onExit} />
  </Box>
);
