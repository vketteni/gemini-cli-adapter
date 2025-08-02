#!/usr/bin/env node

/**
 * Bundle the CLI for distribution
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

function executeCommand(command, options = {}) {
  console.log(`🔧 Executing: ${command}`);
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
      ...options
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error;
  }
}

async function main() {
  console.log('📦 Creating distribution bundle...\n');

  // 1. Clean and build
  console.log('🏗️  Building project...');
  executeCommand('npm run build');

  // 2. Create distribution directory
  const distDir = join(PROJECT_ROOT, 'dist');
  mkdirSync(distDir, { recursive: true });

  // 3. Copy CLI app
  console.log('📁 Copying CLI application...');
  executeCommand(`cp -r apps/gemini-cli/dist ${distDir}/cli`);
  executeCommand(`cp apps/gemini-cli/package.json ${distDir}/`);

  // 4. Create tarball
  console.log('📦 Creating tarball...');
  executeCommand('npm pack apps/gemini-cli', { cwd: PROJECT_ROOT });

  // 5. Create installation instructions
  const installInstructions = `# Gemini CLI Adapter Installation

## Quick Install (Global)
\`\`\`bash
npm install -g gemini-cli-adapter-gemini-cli-0.1.0.tgz
\`\`\`

## Or from NPM (when published)
\`\`\`bash
npm install -g @gemini-cli-adapter/gemini-cli
\`\`\`

## Usage
\`\`\`bash
gemini-adapter --help
gemini-adapter list-adapters
\`\`\`

## Set Adapter Type
\`\`\`bash
export GEMINI_ADAPTER_TYPE=google
gemini-adapter list-adapters
\`\`\`
`;

  writeFileSync(join(PROJECT_ROOT, 'DISTRIBUTION.md'), installInstructions);

  console.log('\n✅ Distribution bundle created!');
  console.log('\n📋 Files created:');
  console.log('   - gemini-cli-adapter-gemini-cli-0.1.0.tgz (installable package)');
  console.log('   - dist/ (bundled files)');
  console.log('   - DISTRIBUTION.md (installation instructions)');
  console.log('\n🚀 To test installation:');
  console.log('   npm install -g ./gemini-cli-adapter-gemini-cli-0.1.0.tgz');
}

main().catch(console.error);