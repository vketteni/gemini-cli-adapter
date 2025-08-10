/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Tool,
  ProviderTool,
  ToolPermissions,
  ToolValidationResult,
  ToolRecommendations
} from '../types/index.js';
import type { CoreConfig } from '../config/CoreConfig.js';
import { ProviderTransformRegistry } from '../providers/ProviderTransformRegistry.js';

/**
 * Dynamic Tool Registry - OpenCode-inspired tool filtering and adaptation
 * 
 * Enhances tool management with OpenCode's dynamic tool filtering patterns,
 * enabling model-aware tool selection and provider-specific tool adaptations.
 */
export class DynamicToolRegistry {
  constructor(
    private baseRegistry: ToolRegistryInterface,
    private config: CoreConfig.Info,
    private providerTransforms: ProviderTransformRegistry = new ProviderTransformRegistry()
  ) {}

  /**
   * Get tools filtered and optimized for specific provider/model combination
   */
  async getToolsForProvider(
    providerId: string,
    modelId: string,
    permissions?: ToolPermissions
  ): Promise<ProviderTool[]> {
    // Get all available tools from base registry
    const allTools = await this.baseRegistry.getAllTools();
    
    // Apply OpenCode's filtering patterns
    const enabledTools = this.getEnabledTools(providerId, modelId, permissions);
    const filteredTools = allTools.filter(tool => enabledTools[tool.name] !== false);
    
    // Transform for provider compatibility
    return this.transformToolsForProvider(filteredTools, providerId, modelId);
  }

  /**
   * Get enabled tools based on OpenCode's filtering patterns
   */
  private getEnabledTools(
    providerId: string,
    modelId: string,
    permissions?: ToolPermissions
  ): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    // Permission-based filtering first
    if (permissions?.edit === false) {
      result['edit'] = false;
      result['write_file'] = false;
      result['patch'] = false;
    }

    if (permissions?.shell === false) {
      result['shell'] = false;
      result['bash'] = false;
    }

    if (permissions?.network === false) {
      result['web_fetch'] = false;
      result['web_search'] = false;
    }

    if (permissions?.filesystem === false) {
      result['read_file'] = false;
      result['ls'] = false;
      result['glob'] = false;
      result['grep'] = false;
    }

    // Get model-specific disabled tools using OpenCode patterns
    const disabledTools = this.providerTransforms.getDisabledTools(providerId, modelId);
    
    disabledTools.forEach(toolName => {
      if (toolName === '*') {
        // Disable all tools (e.g., for O1 models)
        const allTools = this.baseRegistry.getAllTools();
        allTools.then(tools => {
          tools.forEach(tool => {
            result[tool.name] = false;
          });
        });
      } else {
        result[toolName] = false;
      }
    });

    return result;
  }

  /**
   * Transform tools for provider-specific requirements
   */
  private transformToolsForProvider(
    tools: Tool[],
    providerId: string,
    modelId: string
  ): ProviderTool[] {
    return this.providerTransforms.transformTools(tools, providerId, modelId);
  }

  /**
   * Get function declarations with dynamic filtering
   */
  async getFunctionDeclarationsForProvider(
    providerId: string,
    modelId: string,
    permissions?: ToolPermissions
  ) {
    const tools = await this.getToolsForProvider(providerId, modelId, permissions);
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }));
  }

  /**
   * Check if a tool should be enabled for a specific provider/model
   */
  isToolEnabledForProvider(
    toolName: string,
    providerId: string,
    modelId: string,
    permissions?: ToolPermissions
  ): boolean {
    const enabledTools = this.getEnabledTools(providerId, modelId, permissions);
    return enabledTools[toolName] !== false;
  }

  /**
   * Get model-specific tool recommendations based on OpenCode experience
   */
  getToolRecommendations(providerId: string, modelId: string): ToolRecommendations {
    const capabilities = this.providerTransforms.getModelCapabilities(providerId, modelId);
    const recommendations: ToolRecommendations = {
      recommended: [],
      discouraged: [],
      alternative: {}
    };

    // Claude-specific recommendations
    if (capabilities.modelFamily === 'claude') {
      recommendations.discouraged.push('patch');
      recommendations.alternative!['patch'] = 'edit';
      recommendations.recommended.push('edit', 'write_file', 'read_file', 'bash');
    }

    // GPT-specific recommendations
    if (capabilities.modelFamily === 'gpt') {
      recommendations.discouraged.push('todowrite', 'todoread');
      recommendations.recommended.push('edit', 'write_file', 'read_file', 'bash');
    }

    // Gemini-specific recommendations
    if (capabilities.modelFamily === 'gemini') {
      recommendations.recommended.push('edit', 'write_file', 'read_file', 'web_search');
    }

    // Qwen-specific recommendations
    if (capabilities.modelFamily === 'qwen') {
      recommendations.discouraged.push('patch', 'todowrite', 'todoread');
      recommendations.recommended.push('edit', 'write_file', 'read_file');
    }

    // O1 model recommendations
    if (modelId.includes('o1') || modelId.includes('o3')) {
      recommendations.discouraged.push('*'); // O1 doesn't support tools yet
    }

    return recommendations;
  }

  /**
   * Validate tool compatibility with provider/model
   */
  validateToolCompatibility(
    toolName: string,
    providerId: string,
    modelId: string
  ): ToolValidationResult {
    const capabilities = this.providerTransforms.getModelCapabilities(providerId, modelId);
    const warnings: string[] = [];
    const alternatives: string[] = [];
    let compatible = true;

    // Check tool calling support
    if (!capabilities.supportsToolCalls) {
      compatible = false;
      warnings.push(`Model ${modelId} does not support tool calling`);
      return { compatible, warnings };
    }

    // Check specific tool compatibility
    const disabledTools = this.providerTransforms.getDisabledTools(providerId, modelId);
    if (disabledTools.includes(toolName) || disabledTools.includes('*')) {
      compatible = false;
      warnings.push(`Tool ${toolName} is not recommended for ${modelId}`);
      
      // Suggest alternatives based on OpenCode patterns
      if (toolName === 'patch' && capabilities.modelFamily === 'claude') {
        alternatives.push('edit');
        warnings.push('Consider using the edit tool instead of patch for Claude models');
      }
      
      if ((toolName === 'todowrite' || toolName === 'todoread') && capabilities.modelFamily === 'gpt') {
        warnings.push('GPT models work better with direct task management rather than todo tools');
      }
    }

    // Parameter transformation warnings
    const needsTransform = providerId === 'openai' || providerId === 'google';
    if (needsTransform) {
      warnings.push(`Tool parameters will be transformed for ${providerId} compatibility`);
    }

    return { 
      compatible, 
      warnings, 
      alternatives: alternatives.length > 0 ? alternatives : undefined 
    };
  }

  /**
   * Get usage statistics for tool/provider combinations
   * 
   * This provides a framework for tracking tool effectiveness across providers.
   * In a real implementation, this would be populated from telemetry data.
   */
  getToolUsageStats(providerId: string, modelId: string): Record<string, {
    successRate: number;
    avgExecutionTime: number;
    commonErrors: string[];
  }> {
    // Placeholder for usage statistics
    // Real implementation would pull from telemetry/analytics
    return {};
  }

  /**
   * Get the base tool registry
   */
  getBaseRegistry(): ToolRegistryInterface {
    return this.baseRegistry;
  }

  /**
   * Refresh tool registry (reload tools, MCP servers, etc.)
   */
  async refresh(): Promise<void> {
    if ('refresh' in this.baseRegistry && typeof this.baseRegistry.refresh === 'function') {
      await this.baseRegistry.refresh();
    }
  }

  /**
   * Get detailed tool information including compatibility
   */
  async getToolDetails(
    toolName: string,
    providerId: string,
    modelId: string
  ): Promise<ToolDetails | null> {
    const allTools = await this.baseRegistry.getAllTools();
    const tool = allTools.find(t => t.name === toolName);
    
    if (!tool) return null;

    const compatibility = this.validateToolCompatibility(toolName, providerId, modelId);
    const enabled = this.isToolEnabledForProvider(toolName, providerId, modelId, this.config.tools.permissions);

    return {
      ...tool,
      compatibility,
      enabled,
      transformedSchema: this.transformToolsForProvider([tool], providerId, modelId)[0]
    };
  }
}

// Interfaces  
export interface ToolRegistryInterface {
  getAllTools(): Promise<Tool[]>;
  getTool(name: string): Promise<Tool | undefined>;
  refresh?(): Promise<void>;
}

interface ToolDetails extends Tool {
  compatibility: ToolValidationResult;
  enabled: boolean;
  transformedSchema: ProviderTool;
}