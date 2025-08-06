/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Backward compatibility layer for Google types
 * This module provides aliases and adapters to maintain compatibility
 * while migrating to provider-agnostic implementations
 */

import { 
  ToolFunctionDeclaration, 
  ToolParameterSchema, 
  ToolDefinition,
  ParameterType,
  TypeConverter 
} from './tool-types.js';

/**
 * Backward-compatible type aliases
 * These maintain the same names as Google imports for seamless migration
 */

// Main type aliases that match Google's exports
export type FunctionDeclaration = ToolFunctionDeclaration;
export type Schema = ToolParameterSchema;
export type Tool = ToolDefinition;

// Create Google-compatible Type enum mapping
export const Type = {
  // Standard JSON Schema types
  STRING: ParameterType.STRING,
  NUMBER: ParameterType.NUMBER,  
  INTEGER: ParameterType.INTEGER,
  BOOLEAN: ParameterType.BOOLEAN,
  ARRAY: ParameterType.ARRAY,
  OBJECT: ParameterType.OBJECT,
  
  // Google-specific extensions (for backward compatibility)
  TYPE_UNSPECIFIED: 'TYPE_UNSPECIFIED' as any,
} as const;

export type Type = typeof Type[keyof typeof Type];

/**
 * Utility functions for working with backward-compatible types
 */
export class CompatUtils {
  /**
   * Create a FunctionDeclaration (backward-compatible)
   */
  static createFunctionDeclaration(
    name: string,
    description: string,
    parameters: Schema = {}
  ): FunctionDeclaration {
    return {
      name,
      description,
      parameters
    };
  }

  /**
   * Create a Tool with function declarations (backward-compatible)
   */
  static createTool(functionDeclarations: FunctionDeclaration[]): Tool {
    return { functionDeclarations };
  }

  /**
   * Create a Schema (backward-compatible)
   */
  static createSchema(
    type?: Type,
    properties?: Record<string, Schema>,
    required?: string[],
    additionalProps?: any
  ): Schema {
    const schema: Schema = {};
    if (type !== undefined) schema.type = type;
    if (properties) schema.properties = properties;
    if (required) schema.required = required;
    if (additionalProps !== undefined) {
      schema.additionalProperties = additionalProps;
    }
    return schema;
  }

  /**
   * Convert from Google types (when interfacing with existing Google code)
   */
  static fromGoogle = {
    FunctionDeclaration: (googleDecl: any): FunctionDeclaration => ({
      name: googleDecl.name,
      description: googleDecl.description,
      parameters: TypeConverter.fromGoogleSchema(googleDecl.parameters)
    }),

    Schema: TypeConverter.fromGoogleSchema,

    Tool: (googleTool: any): Tool => ({
      functionDeclarations: googleTool.functionDeclarations?.map((decl: any) => 
        CompatUtils.fromGoogle.FunctionDeclaration(decl)
      ) || []
    })
  };

  /**
   * Convert to Google types (when interfacing with Google provider)
   */
  static toGoogle = {
    FunctionDeclaration: TypeConverter.toGoogleFunctionDeclaration,
    
    Schema: TypeConverter.toGoogleSchema,

    Tool: (tool: Tool): any => ({
      functionDeclarations: tool.functionDeclarations.map(decl =>
        TypeConverter.toGoogleFunctionDeclaration(decl)
      )
    })
  };
}

/**
 * Default export for common Schema patterns
 */
export const SchemaBuilder = {
  /**
   * Create a string parameter schema
   */
  string(description?: string, required: boolean = false): Schema {
    const schema: Schema = { type: Type.STRING };
    if (description) schema.description = description;
    return schema;
  },

  /**
   * Create a number parameter schema
   */
  number(description?: string, min?: number, max?: number): Schema {
    const schema: Schema = { type: Type.NUMBER };
    if (description) schema.description = description;
    if (min !== undefined) schema.minimum = min;
    if (max !== undefined) schema.maximum = max;
    return schema;
  },

  /**
   * Create a boolean parameter schema
   */
  boolean(description?: string, defaultValue?: boolean): Schema {
    const schema: Schema = { type: Type.BOOLEAN };
    if (description) schema.description = description;
    if (defaultValue !== undefined) schema.default = defaultValue;
    return schema;
  },

  /**
   * Create an array parameter schema
   */
  array(itemSchema: Schema, description?: string): Schema {
    const schema: Schema = { 
      type: Type.ARRAY,
      items: itemSchema
    };
    if (description) schema.description = description;
    return schema;
  },

  /**
   * Create an object parameter schema
   */
  object(
    properties: Record<string, Schema>,
    required?: string[],
    description?: string
  ): Schema {
    const schema: Schema = {
      type: Type.OBJECT,
      properties
    };
    if (required && required.length > 0) schema.required = required;
    if (description) schema.description = description;
    return schema;
  },

  /**
   * Create an enum string parameter schema
   */
  enum(values: string[], description?: string): Schema {
    const schema: Schema = {
      type: Type.STRING,
      enum: values
    };
    if (description) schema.description = description;
    return schema;
  }
};