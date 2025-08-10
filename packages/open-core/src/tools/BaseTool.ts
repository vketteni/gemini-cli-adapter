/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tool architecture inspired by patterns from OpenCode (https://github.com/sst/opencode)
 * - MIT licensed, design patterns adapted for Open CLI's provider-agnostic architecture
 */

import type { Tool, ToolExecutionContext, ToolResult } from '../types/index.js';
import { z } from 'zod';

/**
 * Base Tool Implementation inspired by OpenCode's tool patterns
 * 
 * This provides the foundational structure for all tools in the system,
 * including validation, error handling, and security checks.
 */
export abstract class BaseTool<TSchema extends z.ZodTypeAny = z.ZodTypeAny> implements Tool {
  public readonly name: string;
  public readonly description: string;
  public readonly schema: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
  
  private readonly parameterSchema: TSchema;
  
  constructor(
    name: string, 
    description: string, 
    parameterSchema: TSchema
  ) {
    this.name = name;
    this.description = description;
    this.parameterSchema = parameterSchema;
    
    // Convert Zod schema to JSON Schema for tool execution
    this.schema = {
      name,
      description,
      parameters: this.zodToJsonSchema(parameterSchema)
    };
  }

  /**
   * Main execution method that handles validation and error handling
   */
  async execute(params: Record<string, any>, context: ToolExecutionContext): Promise<ToolResult> {
    try {
      // Validate parameters
      const validatedParams = this.parameterSchema.parse(params);
      
      // Security check - ensure execution is allowed
      await this.checkPermissions(validatedParams, context);
      
      // Execute the tool implementation
      const result = await this.executeImpl(validatedParams, context);
      
      // Ensure result has required properties
      return {
        output: result.output || '',
        metadata: result.metadata,
        title: result.title || this.generateDefaultTitle(validatedParams)
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ToolValidationError(`Invalid parameters for ${this.name}`, error.errors);
      }
      
      if (error instanceof ToolSecurityError || error instanceof ToolPermissionError) {
        throw error;
      }
      
      throw new ToolExecutionError(`Failed to execute ${this.name}`, error as Error);
    }
  }

  /**
   * Abstract method that each tool must implement
   */
  protected abstract executeImpl(
    params: z.infer<TSchema>, 
    context: ToolExecutionContext
  ): Promise<ToolResult>;

  /**
   * Security check hook - can be overridden by tools that need special security
   */
  protected async checkPermissions(
    params: z.infer<TSchema>, 
    context: ToolExecutionContext
  ): Promise<void> {
    // Base implementation - tools can override for specific security checks
  }

  /**
   * Generate a default title for tool results
   */
  protected generateDefaultTitle(params: z.infer<TSchema>): string {
    return `${this.name} result`;
  }

  /**
   * Helper to validate file paths are within working directory (OpenCode pattern)
   */
  protected validateFilePath(filePath: string, workingDir: string): string {
    const path = require('path');
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(workingDir, filePath);
    
    if (!this.isPathContained(workingDir, absolutePath)) {
      throw new ToolSecurityError(
        `File ${absolutePath} is not within the working directory ${workingDir}`
      );
    }
    
    return absolutePath;
  }

  /**
   * Check if a path is contained within a directory (OpenCode security pattern)
   */
  protected isPathContained(parentDir: string, childPath: string): boolean {
    const path = require('path');
    const relative = path.relative(parentDir, childPath);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  /**
   * Convert Zod schema to JSON Schema for tool execution
   * This is a simplified version - in practice, you'd want a more robust converter
   */
  private zodToJsonSchema(schema: z.ZodTypeAny): Record<string, any> {
    // This is a basic implementation. For production, use a library like zod-to-json-schema
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const zodValue = value as z.ZodTypeAny;
        properties[key] = this.zodTypeToJsonSchema(zodValue);
        
        if (!zodValue.isOptional()) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false
      };
    }

    return this.zodTypeToJsonSchema(schema);
  }

  private zodTypeToJsonSchema(schema: z.ZodTypeAny): any {
    if (schema instanceof z.ZodString) {
      return { type: 'string', description: schema.description };
    }
    if (schema instanceof z.ZodNumber) {
      return { type: 'number', description: schema.description };
    }
    if (schema instanceof z.ZodBoolean) {
      return { type: 'boolean', description: schema.description };
    }
    if (schema instanceof z.ZodOptional) {
      return this.zodTypeToJsonSchema(schema.unwrap());
    }
    if (schema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodTypeToJsonSchema(schema.element),
        description: schema.description
      };
    }
    
    // Fallback
    return { type: 'string', description: schema.description };
  }
}

/**
 * Tool Error Classes
 */
export class ToolError extends Error {
  constructor(message: string, public readonly toolName?: string) {
    super(message);
    this.name = 'ToolError';
  }
}

export class ToolValidationError extends ToolError {
  constructor(message: string, public readonly validationErrors: z.ZodIssue[]) {
    super(message);
    this.name = 'ToolValidationError';
  }
}

export class ToolSecurityError extends ToolError {
  constructor(message: string) {
    super(message);
    this.name = 'ToolSecurityError';
  }
}

export class ToolPermissionError extends ToolError {
  constructor(message: string) {
    super(message);
    this.name = 'ToolPermissionError';
  }
}

export class ToolExecutionError extends ToolError {
  constructor(message: string, public readonly cause: Error) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

/**
 * Tool Factory Function (OpenCode Pattern)
 */
export function defineTool<TSchema extends z.ZodTypeAny>(
  name: string,
  description: string,
  parameterSchema: TSchema,
  implementation: {
    execute: (params: z.infer<TSchema>, context: ToolExecutionContext) => Promise<ToolResult>;
    checkPermissions?: (params: z.infer<TSchema>, context: ToolExecutionContext) => Promise<void>;
    generateTitle?: (params: z.infer<TSchema>) => string;
  }
): Tool {
  return new (class extends BaseTool<TSchema> {
    protected async executeImpl(params: z.infer<TSchema>, context: ToolExecutionContext): Promise<ToolResult> {
      return implementation.execute(params, context);
    }

    protected async checkPermissions(params: z.infer<TSchema>, context: ToolExecutionContext): Promise<void> {
      if (implementation.checkPermissions) {
        await implementation.checkPermissions(params, context);
      }
      return super.checkPermissions(params, context);
    }

    protected generateDefaultTitle(params: z.infer<TSchema>): string {
      if (implementation.generateTitle) {
        return implementation.generateTitle(params);
      }
      return super.generateDefaultTitle(params);
    }
  })(name, description, parameterSchema);
}