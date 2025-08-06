/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Provider-agnostic tool type definitions
 * These replace Google-specific types like FunctionDeclaration, Schema, Type
 */

/**
 * JSON Schema types for tool parameters
 */
export enum ParameterType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
}

/**
 * Provider-agnostic schema definition
 * Compatible with Google Schema and standard JSON Schema
 */
export interface ToolParameterSchema {
  type?: ParameterType;
  description?: string;
  enum?: string[];
  items?: ToolParameterSchema;
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
  default?: any;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number | string; // Support both number and string for Google compatibility
  maxLength?: number | string; // Support both number and string for Google compatibility
  minItems?: number | string; // Support minItems for arrays
  maxItems?: number | string; // Support maxItems for arrays
  pattern?: string;
  additionalProperties?: boolean | ToolParameterSchema;
  anyOf?: ToolParameterSchema[];
}

/**
 * Provider-agnostic function declaration
 * Replaces Google's FunctionDeclaration
 */
export interface ToolFunctionDeclaration {
  name: string;
  description?: string;
  parameters: ToolParameterSchema;
}

/**
 * Tool definition container
 * Replaces Google's Tool structure
 */
export interface ToolDefinition {
  functionDeclarations: ToolFunctionDeclaration[];
}

/**
 * Utility functions for type conversion
 */
export class TypeConverter {
  /**
   * Convert Google Schema to provider-agnostic ToolParameterSchema
   */
  static fromGoogleSchema(googleSchema: any): ToolParameterSchema {
    if (!googleSchema || typeof googleSchema !== 'object') {
      return {};
    }

    const schema: ToolParameterSchema = {};

    // Handle type conversion
    if (googleSchema.type !== undefined) {
      switch (googleSchema.type) {
        case 'STRING':
          schema.type = ParameterType.STRING;
          break;
        case 'NUMBER':
          schema.type = ParameterType.NUMBER;
          break;
        case 'INTEGER':
          schema.type = ParameterType.INTEGER;
          break;
        case 'BOOLEAN':
          schema.type = ParameterType.BOOLEAN;
          break;
        case 'ARRAY':
          schema.type = ParameterType.ARRAY;
          break;
        case 'OBJECT':
          schema.type = ParameterType.OBJECT;
          break;
        default:
          // Handle string-based types (more standard JSON Schema)
          if (typeof googleSchema.type === 'string') {
            schema.type = googleSchema.type as ParameterType;
          }
      }
    }

    // Copy over other properties
    if (googleSchema.description) schema.description = googleSchema.description;
    if (googleSchema.enum) schema.enum = Array.from(googleSchema.enum);
    if (googleSchema.default !== undefined) schema.default = googleSchema.default;
    if (googleSchema.format) schema.format = googleSchema.format;
    if (googleSchema.minimum !== undefined) schema.minimum = googleSchema.minimum;
    if (googleSchema.maximum !== undefined) schema.maximum = googleSchema.maximum;
    if (googleSchema.minLength !== undefined) schema.minLength = googleSchema.minLength;
    if (googleSchema.maxLength !== undefined) schema.maxLength = googleSchema.maxLength;
    if (googleSchema.minItems !== undefined) schema.minItems = googleSchema.minItems;
    if (googleSchema.maxItems !== undefined) schema.maxItems = googleSchema.maxItems;
    if (googleSchema.pattern) schema.pattern = googleSchema.pattern;
    if (googleSchema.required) schema.required = Array.from(googleSchema.required);

    // Handle nested schemas
    if (googleSchema.items) {
      schema.items = this.fromGoogleSchema(googleSchema.items);
    }

    if (googleSchema.properties) {
      schema.properties = {};
      for (const [key, value] of Object.entries(googleSchema.properties)) {
        schema.properties[key] = this.fromGoogleSchema(value);
      }
    }

    if (googleSchema.anyOf && Array.isArray(googleSchema.anyOf)) {
      schema.anyOf = googleSchema.anyOf.map((item: any) => this.fromGoogleSchema(item));
    }

    if (googleSchema.additionalProperties !== undefined) {
      if (typeof googleSchema.additionalProperties === 'boolean') {
        schema.additionalProperties = googleSchema.additionalProperties;
      } else {
        schema.additionalProperties = this.fromGoogleSchema(googleSchema.additionalProperties);
      }
    }

    return schema;
  }

  /**
   * Convert provider-agnostic ToolFunctionDeclaration to Google FunctionDeclaration
   */
  static toGoogleFunctionDeclaration(toolDeclaration: ToolFunctionDeclaration): any {
    return {
      name: toolDeclaration.name,
      description: toolDeclaration.description || '',
      parameters: this.toGoogleSchema(toolDeclaration.parameters)
    };
  }

  /**
   * Convert provider-agnostic ToolParameterSchema to Google Schema
   */
  static toGoogleSchema(schema: ToolParameterSchema): any {
    if (!schema || typeof schema !== 'object') {
      return {};
    }

    const googleSchema: any = {};

    // Handle type conversion
    if (schema.type) {
      switch (schema.type) {
        case ParameterType.STRING:
          googleSchema.type = 'STRING';
          break;
        case ParameterType.NUMBER:
          googleSchema.type = 'NUMBER';
          break;
        case ParameterType.INTEGER:
          googleSchema.type = 'INTEGER';
          break;
        case ParameterType.BOOLEAN:
          googleSchema.type = 'BOOLEAN';
          break;
        case ParameterType.ARRAY:
          googleSchema.type = 'ARRAY';
          break;
        case ParameterType.OBJECT:
          googleSchema.type = 'OBJECT';
          break;
      }
    }

    // Copy over other properties
    if (schema.description) googleSchema.description = schema.description;
    if (schema.enum) googleSchema.enum = Array.from(schema.enum);
    if (schema.default !== undefined) googleSchema.default = schema.default;
    if (schema.format) googleSchema.format = schema.format;
    if (schema.minimum !== undefined) googleSchema.minimum = schema.minimum;
    if (schema.maximum !== undefined) googleSchema.maximum = schema.maximum;
    if (schema.minLength !== undefined) googleSchema.minLength = schema.minLength;
    if (schema.maxLength !== undefined) googleSchema.maxLength = schema.maxLength;
    if (schema.minItems !== undefined) googleSchema.minItems = schema.minItems;
    if (schema.maxItems !== undefined) googleSchema.maxItems = schema.maxItems;
    if (schema.pattern) googleSchema.pattern = schema.pattern;
    if (schema.required) googleSchema.required = Array.from(schema.required);

    // Handle nested schemas
    if (schema.items) {
      googleSchema.items = this.toGoogleSchema(schema.items);
    }

    if (schema.properties) {
      googleSchema.properties = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        googleSchema.properties[key] = this.toGoogleSchema(value);
      }
    }

    if (schema.anyOf && Array.isArray(schema.anyOf)) {
      googleSchema.anyOf = schema.anyOf.map((item: any) => this.toGoogleSchema(item));
    }

    if (schema.additionalProperties !== undefined) {
      if (typeof schema.additionalProperties === 'boolean') {
        googleSchema.additionalProperties = schema.additionalProperties;
      } else {
        googleSchema.additionalProperties = this.toGoogleSchema(schema.additionalProperties);
      }
    }

    return googleSchema;
  }
}