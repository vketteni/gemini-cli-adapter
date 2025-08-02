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

  // Read package info dynamically
  const rootPackage = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8'));
  const appPackage = JSON.parse(readFileSync(join(PROJECT_ROOT, 'apps/open-cli/package.json'), 'utf8'));
  const tarballName = `${appPackage.name.replace('@', '').replace('/', '-')}-${appPackage.version}.tgz`;
  
  console.log(`📋 Building ${appPackage.name} v${appPackage.version}`);
  console.log(`📦 Tarball will be: ${tarballName}\n`);

  // 1. Clean and build
  console.log('🏗️  Building project...');
  executeCommand('npm run build');

  // 2. Create distribution directory
  const distDir = join(PROJECT_ROOT, 'dist');
  mkdirSync(distDir, { recursive: true });

  // 3. Copy CLI app
  console.log('📁 Copying CLI application...');
  executeCommand(`cp -r apps/open-cli/dist ${distDir}/cli`);
  executeCommand(`cp apps/open-cli/package.json ${distDir}/`);

  // 4. Create tarball
  console.log('📦 Creating tarball...');
  executeCommand('npm pack apps/open-cli', { cwd: PROJECT_ROOT });

  // 5. Create installation instructions
  const installInstructions = `# ${rootPackage.name} Installation

## Quick Install (Global)
\`\`\`bash
npm install -g ${tarballName}
\`\`\`

## Or from NPM (when published)
\`\`\`bash
npm install -g ${appPackage.name}
\`\`\`

## Usage
\`\`\`bash
open-cli --help
open-cli list-adapters
\`\`\`

## Set Adapter Type
\`\`\`bash
export OPENCLI_ADAPTER_TYPE=google
open-cli list-adapters
\`\`\`
`;

  writeFileSync(join(PROJECT_ROOT, 'DISTRIBUTION.md'), installInstructions);

  console.log('\n✅ Distribution bundle created!');
  console.log('\n📋 Files created:');
  console.log(`   - ${tarballName} (installable package)`);
  console.log('   - dist/ (bundled files)');
  console.log('   - DISTRIBUTION.md (installation instructions)');
  console.log('\n🚀 To test installation:');
  console.log(`   npm install -g ./${tarballName}`);
}

main().catch(console.error);