/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Tool, ToolExecutionContext, ToolResult } from '../types/index.js';
import { BaseTool } from './BaseTool.js';

/**
 * Concrete Tool Registry implementing OpenCode's tool management patterns
 * 
 * This registry manages all available tools and provides the interface that
 * the DynamicToolRegistry uses for filtering and adaptation.
 */
export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private initialized = false;

  constructor() {
    // Registry starts empty - tools are registered during initialization
  }

  /**
   * Initialize the registry with all available tools
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Import and register all tools
    const { EditTool } = await import('./implementations/EditTool.js');
    const { ReadTool } = await import('./implementations/ReadTool.js');
    const { WriteTool } = await import('./implementations/WriteTool.js');
    const { BashTool } = await import('./implementations/BashTool.js');
    const { GrepTool } = await import('./implementations/GrepTool.js');
    const { GlobTool } = await import('./implementations/GlobTool.js');
    const { ListTool } = await import('./implementations/ListTool.js');
    const { TaskTool } = await import('./implementations/TaskTool.js');
    
    // Register all tools
    this.register(EditTool);
    this.register(ReadTool);
    this.register(WriteTool);
    this.register(BashTool);
    this.register(GrepTool);
    this.register(GlobTool);
    this.register(ListTool);
    this.register(TaskTool);

    this.initialized = true;
  }

  /**
   * Register a tool in the registry
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool from the registry
   */
  unregister(toolName: string): boolean {
    return this.tools.delete(toolName);
  }

  /**
   * Get all available tools (required by DynamicToolRegistry interface)
   */
  async getAllTools(): Promise<Tool[]> {
    await this.initialize();
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name (required by DynamicToolRegistry interface)
   */
  async getTool(name: string): Promise<Tool | undefined> {
    await this.initialize();
    return this.tools.get(name);
  }

  /**
   * Execute a tool by name with the given parameters
   */
  async executeTool(
    toolName: string, 
    params: Record<string, any>, 
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const tool = await this.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    return await tool.execute(params, context);
  }

  /**
   * Get tool names (ids) for quick reference
   */
  async getToolNames(): Promise<string[]> {
    await this.initialize();
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool exists
   */
  async hasTool(name: string): Promise<boolean> {
    await this.initialize();
    return this.tools.has(name);
  }

  /**
   * Get tool count
   */
  async getToolCount(): Promise<number> {
    await this.initialize();
    return this.tools.size;
  }

  /**
   * Refresh the registry (reload tools, MCP servers, etc.)
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    this.tools.clear();
    await this.initialize();
  }

  /**
   * Get tools filtered by category or capability
   */
  async getToolsByCategory(category: ToolCategory): Promise<Tool[]> {
    const allTools = await this.getAllTools();
    return allTools.filter(tool => this.getToolCategory(tool) === category);
  }

  /**
   * Determine tool category based on tool name/description
   */
  private getToolCategory(tool: Tool): ToolCategory {
    const name = tool.name.toLowerCase();
    
    if (['edit', 'write', 'write_file', 'patch'].includes(name)) {
      return ToolCategory.FileEditing;
    }
    
    if (['read', 'read_file', 'ls', 'list'].includes(name)) {
      return ToolCategory.FileReading;
    }
    
    if (['bash', 'shell', 'exec'].includes(name)) {
      return ToolCategory.ShellExecution;
    }
    
    if (['grep', 'search', 'find'].includes(name)) {
      return ToolCategory.Search;
    }
    
    if (['glob', 'match'].includes(name)) {
      return ToolCategory.Pattern;
    }
    
    if (['task', 'agent', 'spawn'].includes(name)) {
      return ToolCategory.Agent;
    }
    
    if (['web_fetch', 'web_search', 'fetch'].includes(name)) {
      return ToolCategory.Network;
    }
    
    return ToolCategory.Other;
  }

  /**
   * Get comprehensive tool information
   */
  async getToolInfo(toolName: string): Promise<ToolInfo | null> {
    const tool = await this.getTool(toolName);
    if (!tool) return null;

    return {
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
      category: this.getToolCategory(tool),
      capabilities: this.getToolCapabilities(tool),
      securityLevel: this.getToolSecurityLevel(tool)
    };
  }

  /**
   * Determine tool capabilities
   */
  private getToolCapabilities(tool: Tool): ToolCapability[] {
    const name = tool.name.toLowerCase();
    const capabilities: ToolCapability[] = [];

    if (['edit', 'write', 'write_file', 'patch'].includes(name)) {
      capabilities.push(ToolCapability.FileModification);
    }
    
    if (['read', 'read_file', 'ls', 'list', 'grep', 'glob'].includes(name)) {
      capabilities.push(ToolCapability.FileReading);
    }
    
    if (['bash', 'shell'].includes(name)) {
      capabilities.push(ToolCapability.ShellAccess, ToolCapability.SystemModification);
    }
    
    if (['web_fetch', 'web_search'].includes(name)) {
      capabilities.push(ToolCapability.NetworkAccess);
    }
    
    if (['task', 'agent'].includes(name)) {
      capabilities.push(ToolCapability.AgentSpawning);
    }

    return capabilities;
  }

  /**
   * Determine tool security level
   */
  private getToolSecurityLevel(tool: Tool): ToolSecurityLevel {
    const capabilities = this.getToolCapabilities(tool);
    
    if (capabilities.includes(ToolCapability.SystemModification) || 
        capabilities.includes(ToolCapability.ShellAccess)) {
      return ToolSecurityLevel.High;
    }
    
    if (capabilities.includes(ToolCapability.FileModification) || 
        capabilities.includes(ToolCapability.NetworkAccess)) {
      return ToolSecurityLevel.Medium;
    }
    
    return ToolSecurityLevel.Low;
  }

  /**
   * Validate tool integrity (ensure all tools are properly implemented)
   */
  async validateRegistry(): Promise<RegistryValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const toolCount = await this.getToolCount();

    if (toolCount === 0) {
      errors.push('No tools registered in registry');
    }

    for (const [name, tool] of this.tools) {
      // Check basic properties
      if (!tool.name || !tool.description || !tool.schema) {
        errors.push(`Tool '${name}' is missing required properties`);
      }

      // Check if tool extends BaseTool (recommended pattern)
      if (!(tool instanceof BaseTool)) {
        warnings.push(`Tool '${name}' does not extend BaseTool - may lack security features`);
      }

      // Validate schema structure
      if (tool.schema && typeof tool.schema.parameters !== 'object') {
        errors.push(`Tool '${name}' has invalid schema structure`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      toolCount
    };
  }
}

/**
 * Tool categorization for better organization
 */
export enum ToolCategory {
  FileEditing = 'file_editing',
  FileReading = 'file_reading',
  ShellExecution = 'shell_execution',
  Search = 'search',
  Pattern = 'pattern',
  Agent = 'agent',
  Network = 'network',
  Other = 'other'
}

/**
 * Tool capability flags
 */
export enum ToolCapability {
  FileReading = 'file_reading',
  FileModification = 'file_modification',
  ShellAccess = 'shell_access',
  SystemModification = 'system_modification',
  NetworkAccess = 'network_access',
  AgentSpawning = 'agent_spawning'
}

/**
 * Tool security levels
 */
export enum ToolSecurityLevel {
  Low = 'low',        // Read-only operations
  Medium = 'medium',  // File modifications, network access
  High = 'high'       // Shell access, system modifications
}

/**
 * Tool information interface
 */
export interface ToolInfo {
  name: string;
  description: string;
  schema: {
    name: string;
    description: string;
    parameters?: Record<string, any>;
  };
  category: ToolCategory;
  capabilities: ToolCapability[];
  securityLevel: ToolSecurityLevel;
}

/**
 * Registry validation result
 */
export interface RegistryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  toolCount: number;
}