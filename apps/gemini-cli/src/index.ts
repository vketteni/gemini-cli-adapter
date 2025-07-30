#!/usr/bin/env node

/**
 * AI CLI - Universal CLI for AI language models
 */

import { Command } from 'commander';
import { GoogleAdapter } from '@gemini-cli-adapter/google-adapter';

const program = new Command();

program
  .name('ai-cli')
  .description('Universal CLI for AI language models with pluggable adapters')
  .version('0.1.0');

program
  .command('chat')
  .description('Start an interactive chat session')
  .option('-a, --adapter <adapter>', 'AI adapter to use', 'google')
  .action(async (options) => {
    console.log(`Starting chat with ${options.adapter} adapter...`);
    
    // TODO: Initialize adapter and start chat
    const adapter = new GoogleAdapter();
    await adapter.initialize();
    
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
