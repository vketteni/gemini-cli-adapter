/**
 * CLI implementation
 */

import { CoreAdapter } from '@ai-cli-adapter/core-interface';

export class CLI {
  constructor(private adapter: CoreAdapter) {}

  async start() {
    console.log(`Starting CLI with ${this.adapter.name} adapter`);
    // TODO: Implement CLI logic
  }
}