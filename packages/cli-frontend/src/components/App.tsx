/**
 * Main App component
 */

import React from 'react';
import { Box, Text } from 'ink';

export interface AppProps {
  adapterName?: string;
}

export const App: React.FC<AppProps> = ({ adapterName = 'Unknown' }) => {
  return (
    <Box flexDirection="column">
      <Text>AI CLI Adapter</Text>
      <Text>Using adapter: {adapterName}</Text>
    </Box>
  );
};