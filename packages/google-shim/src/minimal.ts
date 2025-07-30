/**
 * Minimal Google Gemini CLI Core Compatibility Shim
 * 
 * This is a bare-bones implementation that exports just enough to make
 * the first import (Icon) work. We'll expand it incrementally.
 */

// Just export Icon for now to test the alias mechanism
export { Icon } from '@gemini-cli-adapter/core-interface';

// Add other exports as we encounter compilation errors
export * from '@gemini-cli-adapter/core-interface';