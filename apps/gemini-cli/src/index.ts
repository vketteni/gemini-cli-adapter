#!/usr/bin/env node

/**
 * DEMO CLI - Demo implementation for google gemini cli
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('demo-cli')
  .description('Demo implementation for google gemini cli')
  .version('0.1.0');

program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-a, --adapter <adapter>', 'AI adapter to use', 'google')
  .action(async (options) => {
    console.log(`Starting chat with ${options.adapter} adapter...`);
    
    // TODO: Implement proper adapter initialization after architecture is finalized
    console.log('Chat functionality coming soon!');
  });

program
  .command('list-adapters')
  .description('List available adapters')
  .action(() => {
    console.log('Available adapters:');
    console.log('  google - Google Gemini adapter');
    console.log('  More adapters coming soon!');
  });

program.parse();
