/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Text } from 'ink';
import { ideContext } from '@google/gemini-cli-core';
import { Colors } from '../colors.js';
import path from 'node:path';

interface IDEContextDetailDisplayProps {
  ideContext: ReturnType<typeof ideContext.getOpenFilesContext>;
}

export function IDEContextDetailDisplay({
  ideContext,
}: IDEContextDetailDisplayProps) {
  if (!ideContext) {
    return null;
  }

  const hasFiles = ideContext.activeFile || (ideContext.recentOpenFiles && ideContext.recentOpenFiles.length > 0);
  if (!hasFiles) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      borderStyle="round"
      borderColor={Colors.AccentCyan}
      paddingX={1}
    >
      <Text color={Colors.AccentCyan} bold>
        IDE Context (ctrl+e to toggle)
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {ideContext.activeFile && (
          <Text bold>
            Active file: {path.basename(ideContext.activeFile)}
          </Text>
        )}
        {ideContext.recentOpenFiles && ideContext.recentOpenFiles.length > 0 && (
          <>
            <Text bold>Recent files:</Text>
            {ideContext.recentOpenFiles.map((file) => (
              <Text key={file.filePath}>
                - {path.basename(file.filePath)}
              </Text>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
