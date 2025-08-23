/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import z from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI support following OpenCode patterns
extendZodWithOpenApi(z);

export namespace UIMessage {
  // Base schema for all UI messages
  const Base = z.object({
    id: z.string(),
    timestamp: z.number(),
  });

  // Core message content types
  export const TextContent = Base.extend({
    type: z.literal('text'),
    text: z.string(),
    role: z.enum(['user', 'assistant']),
  }).openapi('TextContent');
  export type TextContent = z.infer<typeof TextContent>;

  export const ErrorContent = Base.extend({
    type: z.literal('error'),
    message: z.string(),
    details: z.string().optional(),
  }).openapi('ErrorContent');
  export type ErrorContent = z.infer<typeof ErrorContent>;

  export const InfoContent = Base.extend({
    type: z.literal('info'),
    message: z.string(),
  }).openapi('InfoContent');
  export type InfoContent = z.infer<typeof InfoContent>;

  // Tool-related message types
  export const ToolCallContent = Base.extend({
    type: z.literal('tool-call'),
    toolName: z.string(),
    toolId: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'error']),
  }).openapi('ToolCallContent');
  export type ToolCallContent = z.infer<typeof ToolCallContent>;

  export const ToolResultContent = Base.extend({
    type: z.literal('tool-result'),
    toolName: z.string(),
    toolId: z.string(),
    result: z.string(),
    success: z.boolean(),
  }).openapi('ToolResultContent');
  export type ToolResultContent = z.infer<typeof ToolResultContent>;

  // System/UI specific message types
  export const StatsContent = Base.extend({
    type: z.literal('stats'),
    duration: z.string(),
    tokenCount: z.number().optional(),
    cost: z.number().optional(),
  }).openapi( 'StatsContent' );
  export type StatsContent = z.infer<typeof StatsContent>;

  export const AboutContent = Base.extend({
    type: z.literal('about'),
    cliVersion: z.string(),
    osVersion: z.string(),
    modelVersion: z.string(),
    providerInfo: z.record(z.any()),
  }).openapi( 'AboutContent' );
  export type AboutContent = z.infer<typeof AboutContent>;

  // Main discriminated union
  export const Content = z.discriminatedUnion('type', [
    TextContent,
    ErrorContent,
    InfoContent,
    ToolCallContent,
    ToolResultContent,
    StatsContent,
    AboutContent,
  ]).openapi( 'MessageContent' );
  export type Content = z.infer<typeof Content>;

  // Streaming state for UI
  export const StreamingState = z.enum([
    'idle',
    'responding',
    'waiting_for_confirmation',
  ]).openapi( 'StreamingState' );
  export type StreamingState = z.infer<typeof StreamingState>;

  // Tool call status tracking
  export const ToolCallStatus = z.enum([
    'pending',
    'running', 
    'completed',
    'error',
    'cancelled',
  ]).openapi( 'ToolCallStatus' );
  export type ToolCallStatus = z.infer<typeof ToolCallStatus>;

  // Slash command result types
  export const SlashCommandResult = z.discriminatedUnion('type', [
    z.object({
      type: z.literal('submit_prompt'),
      content: z.string(),
    }),
    z.object({
      type: z.literal('schedule_tool'),
      toolName: z.string(),
      toolArgs: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('handled'),
    }),
  ]).openapi( 'SlashCommandResult' );
  export type SlashCommandResult = z.infer<typeof SlashCommandResult>;

  // Console message for debug/logging
  export const ConsoleMessage = z.object({
    type: z.enum(['log', 'warn', 'error', 'debug']),
    content: z.string(),
    count: z.number(),
  }).openapi( 'ConsoleMessage' );
  export type ConsoleMessage = z.infer<typeof ConsoleMessage>;
}

// Export commonly used types at top level for convenience
export type MessageContent = UIMessage.Content;
export type StreamingState = UIMessage.StreamingState;
export type ToolCallStatus = UIMessage.ToolCallStatus;
export type SlashCommandResult = UIMessage.SlashCommandResult;