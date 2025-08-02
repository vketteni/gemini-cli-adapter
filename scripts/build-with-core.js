#!/usr/bin/env node

/**
 * Build orchestration script for the Gemini CLI Adapter project
 * Ensures proper build order and dependency resolution
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = process.cwd();

/**
 * Execute a command and return a promise
 */
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Executing: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: options.cwd || PROJECT_ROOT,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Generate git commit info
 */
async function generateGitCommitInfo() {
  console.log('🔧 Generating git commit info...');
  await executeCommand('node', ['scripts/generate-git-commit-info.js']);
  console.log('✅ Git commit info generated');
}

/**
 * Build packages in dependency order using TypeScript project references
 */
async function buildPackages() {
  console.log('📦 Building packages in dependency order...\n');
  
  // Build order: core-interface → core_copy → gemini-cli-core-shim → cli
  const buildOrder = [
    'packages/core-interface',
    'packages/core_copy', 
    'packages/gemini-cli-core-shim',
    'packages/cli'
  ];

  for (const packagePath of buildOrder) {
    const fullPath = path.join(PROJECT_ROOT, packagePath);
    const packageExists = await directoryExists(fullPath);
    
    if (!packageExists) {
      console.log(`⚠️  Package ${packagePath} not found, skipping...`);
      continue;
    }

    console.log(`\n📦 Building ${packagePath}...`);
    
    // Use TypeScript project references for better build performance
    try {
      await executeCommand('npx', ['tsc', '--build', '--force'], { cwd: fullPath });
    } catch (error) {
      // Fallback to npm run build if tsc --build fails
      console.log('📝 TypeScript build failed, trying npm build...');
      await executeCommand('npm', ['run', 'build'], { cwd: fullPath });
    }
    
    console.log(`✅ ${packagePath} built successfully`);
  }
}

/**
 * Build apps
 */
async function buildApps() {
  console.log('\n🚀 Building applications...\n');
  
  const appPath = path.join(PROJECT_ROOT, 'apps/gemini-cli');
  const appExists = await directoryExists(appPath);
  
  if (appExists) {
    console.log('📱 Building apps/gemini-cli...');
    await executeCommand('npm', ['run', 'build'], { cwd: appPath });
    console.log('✅ apps/gemini-cli built successfully');
  } else {
    console.log('⚠️  apps/gemini-cli not found, skipping...');
  }
}

/**
 * Main build process
 */
async function main() {
  try {
    console.log('🏗️  Starting Gemini CLI Adapter build process...\n');
    
    // Install dependencies first
    console.log('📥 Installing dependencies...');
    await executeCommand('npm', ['install']);
    console.log('✅ Dependencies installed');
    
    // Generate git commit info
    await generateGitCommitInfo();
    
    // Build packages
    await buildPackages();
    
    // Build apps
    await buildApps();
    
    console.log('\n🎉 Build completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   - Run "npm run demo" to test the CLI');
    console.log('   - Run "npm run test" to run all tests');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();