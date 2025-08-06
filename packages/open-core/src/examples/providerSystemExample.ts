/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive example of using the new provider system
 * This shows how to migrate from the old system and use the new features
 */

import {
  // Provider system
  globalDynamicProviderConfig,
  globalProviderDiscovery,
  globalMigrationHelper,
  globalProviderRegistry,
  
  // Integration helpers
  enhanceConfigWithProviders,
  ConfigProviderIntegration,
  
  // Core components
  Config,
  ProviderClient,
  
  // Types
  DynamicProviderConfig,
  ProviderConfig
} from '../index.js';

/**
 * Example 1: Basic provider system usage
 */
async function basicProviderExample() {
  console.log('=== Basic Provider System Example ===');
  
  // Initialize provider discovery
  await globalProviderDiscovery.initialize();
  
  // Get available providers
  const providers = globalProviderDiscovery.getAvailableProviders();
  console.log('Available providers:', providers.map(p => p.name));
  
  // Auto-detect best provider
  const detected = await globalProviderDiscovery.autoDetectProvider();
  if (detected) {
    console.log(`Detected provider: ${detected.provider} with model: ${detected.config.model}`);
    
    // Create AI provider
    const aiProvider = await globalProviderRegistry.getAIProvider(detected.provider, detected.config);
    
    // Test token counting
    const tokenCount = await aiProvider.countTokens({
      messages: [{ role: 'user', content: 'Hello, world!' }],
      model: detected.config.model || 'default'
    });
    
    console.log(`Token count: ${tokenCount.total_tokens}`);
  }
}

/**
 * Example 2: Using dynamic configuration
 */
async function dynamicConfigExample() {
  console.log('=== Dynamic Configuration Example ===');
  
  // Initialize dynamic provider configuration
  const config = await globalDynamicProviderConfig.initialize();
  console.log(`Primary provider: ${config.primary.provider}`);
  console.log(`Fallbacks: ${config.fallbacks?.map(f => f.provider).join(', ') || 'none'}`);
  
  // Create AI provider with fallback support
  const provider = await globalDynamicProviderConfig.createAIProviderWithFallback();
  
  // Test provider
  try {
    const response = await provider.generateContent({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: config.primary.config.model || 'default'
    });
    
    console.log('Response:', response.choices[0]?.message?.content);
  } catch (error) {
    console.log('Primary provider failed, trying fallback...');
    
    // Access fallback if available
    if ('getFallbackProvider' in provider && provider.getFallbackProvider) {
      try {
        const fallbackProvider = await provider.getFallbackProvider();
        const response = await fallbackProvider.generateContent({
          messages: [{ role: 'user', content: 'Say hello' }],
          model: 'default'
        });
        
        console.log('Fallback response:', response.choices[0]?.message?.content);
      } catch (fallbackError) {
        console.error('All providers failed:', fallbackError);
      }
    }
  }
}

/**
 * Example 3: Migration from legacy system
 */
async function migrationExample() {
  console.log('=== Migration Example ===');
  
  // Check if migration is needed
  const report = await globalMigrationHelper.createMigrationReport();
  console.log('Migration report:', {
    needsMigration: report.needsMigration,
    recommendations: report.recommendations
  });
  
  if (report.needsMigration) {
    // Perform migration
    const migratedConfig = await globalMigrationHelper.autoMigrate();
    if (migratedConfig) {
      console.log('Migration successful!');
      console.log(`Migrated to provider: ${migratedConfig.primary.provider}`);
    }
  }
}

/**
 * Example 4: Integration with existing Config class
 */
async function configIntegrationExample() {
  console.log('=== Config Integration Example ===');
  
  // Create existing Config instance (this would be your current setup)
  const config = new Config({
    sessionId: 'example-session',
    targetDir: process.cwd(),
    debugMode: false,
    cwd: process.cwd(),
    model: 'gemini-1.5-pro'
  });
  
  await config.initialize();
  
  // Enhance config with provider system
  const integration = await enhanceConfigWithProviders(config);
  
  // Now config.getGeminiClient() will use the provider system
  const client = config.getGeminiClient();
  console.log('Enhanced config ready with provider system');
  
  // Get provider information
  const providerInfo = integration.getCurrentProviderInfo();
  console.log('Current provider:', providerInfo);
  
  // Test provider health
  const health = await integration.getProviderHealth();
  console.log('Provider health:', health);
}

/**
 * Example 5: Using the new ProviderClient
 */
async function providerClientExample() {
  console.log('=== Provider Client Example ===');
  
  // Initialize provider system
  const config = await globalDynamicProviderConfig.initialize();
  const aiProvider = await globalDynamicProviderConfig.createAIProvider();
  
  // Create mock Config for ProviderClient
  const mockConfig = {
    getWorkingDir: () => process.cwd(),
    getModel: () => config.primary.config.model || 'default',
    getEmbeddingModel: () => 'embedding-001',
    getFileService: () => ({ shouldIgnoreFile: () => Promise.resolve(false) }),
    getToolRegistry: () => Promise.resolve({
      getFunctionDeclarations: () => [],
      getTool: () => undefined
    }),
    getFullContext: () => false
  } as any;
  
  // Create ProviderClient
  const client = new ProviderClient(mockConfig);
  await client.initialize(aiProvider);
  
  // Use streaming
  console.log('Starting streaming example...');
  for await (const chunk of client.sendMessageStream('Tell me a short joke')) {
    if (chunk.type === 'content' && chunk.value) {
      process.stdout.write(chunk.value);
    }
  }
  console.log('\nStreaming complete!');
}

/**
 * Example 6: Provider switching and health monitoring
 */
async function providerManagementExample() {
  console.log('=== Provider Management Example ===');
  
  // Initialize system
  await globalDynamicProviderConfig.initialize();
  
  // Get initial provider health
  let health = await globalDynamicProviderConfig.getProviderHealth();
  console.log('Initial health:', Object.keys(health).map(provider => 
    `${provider}: ${health[provider].configured ? 'configured' : 'not configured'}`
  ));
  
  // Switch providers if multiple are available
  const availableProviders = globalProviderDiscovery.getAvailableProviders();
  const configuredProviders = Object.entries(health)
    .filter(([_, status]) => status.configured)
    .map(([name]) => name);
  
  if (configuredProviders.length > 1) {
    console.log(`Switching from current to: ${configuredProviders[1]}`);
    
    await globalDynamicProviderConfig.switchProvider(configuredProviders[1]);
    console.log('Provider switched successfully');
    
    // Check health after switch
    health = await globalDynamicProviderConfig.getProviderHealth();
    console.log('Health after switch:', health[configuredProviders[1]]);
  }
}

/**
 * Run all examples
 */
export async function runAllProviderExamples() {
  console.log('🚀 Open CLI Provider System Examples\n');
  
  try {
    await basicProviderExample();
    console.log('\n');
    
    await dynamicConfigExample();
    console.log('\n');
    
    await migrationExample();
    console.log('\n');
    
    await configIntegrationExample();
    console.log('\n');
    
    await providerClientExample();
    console.log('\n');
    
    await providerManagementExample();
    console.log('\n');
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Export individual examples for selective usage
export {
  basicProviderExample,
  dynamicConfigExample,
  migrationExample,
  configIntegrationExample,
  providerClientExample,
  providerManagementExample
};