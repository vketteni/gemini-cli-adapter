/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { MessageContent, UIMessage } from '../message.js';

interface MessageDisplayProps {
  message: MessageContent;
  terminalWidth: number;
  isPending?: boolean;
  availableHeight?: number;
}

/**
 * Clean message display component following OpenCode patterns
 * Uses discriminated union pattern matching instead of messy conditionals
 */
export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  message,
  terminalWidth,
  isPending = false,
  availableHeight,
}) => {
  // Pattern match on message type - OpenCode style
  switch (message.type) {
    case 'text':
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={message.role === 'user' ? 'blue' : 'green'}>
              {message.role === 'user' ? '❯ ' : '🤖 '}
            </Text>
            <Text>{message.text}</Text>
          </Box>
          {isPending && (
            <Text dimColor> • thinking...</Text>
          )}
        </Box>
      );

    case 'error':
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="red">❌ </Text>
            <Text color="red">{message.message}</Text>
          </Box>
          {message.details && (
            <Box marginLeft={3}>
              <Text dimColor>{message.details}</Text>
            </Box>
          )}
        </Box>
      );

    case 'info':
      return (
        <Box marginBottom={1}>
          <Text color="cyan">ℹ️  </Text>
          <Text dimColor>{message.message}</Text>
        </Box>
      );

    case 'tool-call':
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color="yellow">
              {getToolIcon(message.status)} {message.toolName}
            </Text>
          </Box>
          <Box marginLeft={3}>
            <Text dimColor>
              {getToolStatusText(message.status)}
            </Text>
          </Box>
        </Box>
      );

    case 'tool-result':
      return (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={message.success ? 'green' : 'red'}>
              {message.success ? '✅' : '❌'} {message.toolName}
            </Text>
          </Box>
          {message.result && (
            <Box marginLeft={3} flexDirection="column">
              <Text wrap="wrap" dimColor>
                {truncateResult(message.result, terminalWidth - 4)}
              </Text>
            </Box>
          )}
        </Box>
      );

    case 'stats':
      return (
        <Box marginBottom={1}>
          <Text color="magenta">📊 </Text>
          <Text dimColor>
            Session completed in {message.duration}
            {message.tokenCount && ` • ${message.tokenCount} tokens`}
            {message.cost && ` • $${message.cost.toFixed(4)}`}
          </Text>
        </Box>
      );

    case 'about':
      return (
        <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor="gray" padding={1}>
          <Text bold color="cyan">Open CLI Information</Text>
          <Text>Version: {message.cliVersion}</Text>
          <Text>OS: {message.osVersion}</Text>
          <Text>Model: {message.modelVersion}</Text>
          {Object.entries(message.providerInfo).map(([key, value]) => (
            <Text key={key}>{key}: {String(value)}</Text>
          ))}
        </Box>
      );

    default:
      // TypeScript exhaustiveness check - this should never happen
      const _exhaustive: never = message;
      return (
        <Box marginBottom={1}>
          <Text color="red">❓ Unknown message type</Text>
        </Box>
      );
  }
};

// Helper functions following OpenCode's utility pattern
function getToolIcon(status: UIMessage.ToolCallStatus): string {
  switch (status) {
    case 'pending': return '⏳';
    case 'running': return '🔄'; 
    case 'completed': return '✅';
    case 'error': return '❌';
    case 'cancelled': return '🚫';
  }
}

function getToolStatusText(status: UIMessage.ToolCallStatus): string {
  switch (status) {
    case 'pending': return 'Preparing...';
    case 'running': return 'Executing...';
    case 'completed': return 'Completed';
    case 'error': return 'Failed';
    case 'cancelled': return 'Cancelled';
  }
}

function truncateResult(result: string, maxWidth: number): string {
  if (result.length <= maxWidth) return result;
  
  // Smart truncation - try to keep useful content
  const lines = result.split('\n');
  if (lines.length > 3) {
    return lines.slice(0, 2).join('\n') + '\n... (truncated)';
  }
  
  return result.substring(0, maxWidth - 15) + '... (truncated)';
}