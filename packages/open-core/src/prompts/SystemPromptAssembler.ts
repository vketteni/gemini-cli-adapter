/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import * as os from 'node:os';
import type { CoreConfig } from '../config/CoreConfig.js';

export interface PromptContext {
  mode?: 'chat' | 'plan';
  customSystem?: string;
  projectRoot?: string;
  gitInfo?: GitInfo;
  customInstructionPaths?: string[];
}

export interface GitInfo {
  isRepo: boolean;
  branch?: string;
  hasUncommitted?: boolean;
}

/**
 * System Prompt Assembler - OpenCode-inspired modular prompt system
 * 
 * Dynamically assembles system prompts based on provider, model, environment,
 * and custom instructions using OpenCode's sophisticated prompt engineering patterns.
 */
export class SystemPromptAssembler {
  constructor(
    private config: CoreConfig.Info,
    private fileSystem?: FileSystemService
  ) {}

  /**
   * Assemble complete system prompt array
   */
  async assemble(
    providerId: string,
    modelId: string,
    context: PromptContext
  ): Promise<string[]> {
    const prompts: string[] = [];

    // 1. Provider-specific headers (OpenCode pattern)
    prompts.push(...this.getProviderHeader(providerId));

    // 2. Model-specific prompts or custom system
    if (context.customSystem) {
      prompts.push(context.customSystem);
    } else if (context.mode === 'plan') {
      prompts.push(...this.getPlanModePrompts(modelId));
    } else {
      prompts.push(...this.getModelSpecificPrompts(modelId));
    }

    // 3. Environment context
    prompts.push(...await this.getEnvironmentContext(context));

    // 4. Custom instructions
    prompts.push(...await this.getCustomInstructions(context));

    // 5. Optimize for caching (max 2 system messages for OpenCode compatibility)
    return this.optimizeForCaching(prompts);
  }

  /**
   * Get provider-specific headers
   */
  private getProviderHeader(providerId: string): string[] {
    // Anthropic requires specific formatting for optimal performance
    if (providerId.includes('anthropic')) {
      return [ANTHROPIC_SYSTEM_HEADER];
    }
    return [];
  }

  /**
   * Get model-specific optimized prompts
   */
  private getModelSpecificPrompts(modelId: string): string[] {
    // Claude-optimized prompts
    if (modelId.includes('claude')) {
      return [CLAUDE_SYSTEM_PROMPT];
    }
    
    // GPT-optimized prompts
    if (modelId.includes('gpt-') || modelId.includes('o1') || modelId.includes('o3')) {
      return [GPT_SYSTEM_PROMPT];
    }
    
    // Gemini-optimized prompts  
    if (modelId.includes('gemini')) {
      return [GEMINI_SYSTEM_PROMPT];
    }

    // Qwen-specific prompts
    if (modelId.includes('qwen')) {
      return [QWEN_SYSTEM_PROMPT];
    }

    return [DEFAULT_SYSTEM_PROMPT];
  }

  /**
   * Get plan mode specific prompts
   */
  private getPlanModePrompts(modelId: string): string[] {
    const basePrompts = this.getModelSpecificPrompts(modelId);
    return [
      ...basePrompts,
      PLAN_MODE_ADDITION
    ];
  }

  /**
   * Get environment context information
   */
  private async getEnvironmentContext(context: PromptContext): Promise<string[]> {
    if (!context.projectRoot) return [];

    const envInfo = [
      `<env>`,
      `Working directory: ${context.projectRoot}`,
      `Is directory a git repo: ${context.gitInfo?.isRepo ? 'yes' : 'no'}`,
      `Platform: ${process.platform}`,
      `Today's date: ${new Date().toISOString().split('T')[0]}`,
      `</env>`
    ];

    // Add project structure if available
    if (context.gitInfo?.isRepo) {
      const projectTree = await this.getProjectTree(context.projectRoot);
      if (projectTree) {
        envInfo.push(`<project>`, projectTree, `</project>`);
      }
    }

    return [envInfo.join('\n')];
  }

  /**
   * Load custom instruction files
   */
  private async getCustomInstructions(context: PromptContext): Promise<string[]> {
    if (!context.projectRoot) return [];

    const customFiles = context.customInstructionPaths || this.config.workspace.customInstructionPaths;
    const instructions: string[] = [];

    // Find custom instruction files in project hierarchy
    for (const filename of customFiles) {
      const matches = await this.findFilesUp(filename, context.projectRoot);
      for (const filePath of matches) {
        try {
          const content = await this.readFile(filePath);
          if (content.trim()) {
            instructions.push(content);
          }
        } catch (error) {
          console.warn(`Failed to read custom instruction file ${filePath}:`, error);
        }
      }
    }

    // Add global config files
    const globalPaths = [
      path.join(os.homedir(), '.claude', 'CLAUDE.md'),
      path.join(os.homedir(), '.config', 'open-cli', 'instructions.md'),
      path.join(os.homedir(), '.opencode', 'AGENTS.md')
    ];

    for (const globalPath of globalPaths) {
      try {
        const content = await this.readFile(globalPath);
        if (content.trim()) {
          instructions.push(content);
        }
      } catch {
        // Ignore missing global files
      }
    }

    return instructions;
  }

  /**
   * Optimize prompts for caching efficiency (OpenCode pattern)
   */
  private optimizeForCaching(prompts: string[]): string[] {
    if (prompts.length <= 2) return prompts;

    // Combine all but first prompt for caching efficiency
    const [first, ...rest] = prompts;
    return [first, rest.join('\n\n')];
  }

  /**
   * Get project tree structure
   */
  private async getProjectTree(projectRoot: string): Promise<string | null> {
    try {
      // Mock implementation - would integrate with actual file system
      // This should respect .gitignore and provide a reasonable tree structure
      return `src/\n  index.ts\n  types/\n    index.ts\npackage.json\nREADME.md`;
    } catch (error) {
      console.warn('Failed to get project tree:', error);
      return null;
    }
  }

  /**
   * Find files up the directory hierarchy
   */
  private async findFilesUp(filename: string, startDir: string): Promise<string[]> {
    const matches: string[] = [];
    let currentDir = startDir;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const filePath = path.join(currentDir, filename);
      try {
        await this.fileExists(filePath);
        matches.push(filePath);
      } catch {
        // File doesn't exist, continue
      }

      currentDir = path.dirname(currentDir);
    }

    return matches;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<void> {
    if (this.fileSystem) {
      return this.fileSystem.fileExists(filePath);
    }
    
    // Mock implementation
    throw new Error('File system service not available');
  }

  /**
   * Read file content
   */
  private async readFile(filePath: string): Promise<string> {
    if (this.fileSystem) {
      return this.fileSystem.readFile(filePath);
    }
    
    // Mock implementation for development
    return `Mock content from ${filePath}`;
  }
}

// File System Service Interface
interface FileSystemService {
  readFile(filePath: string): Promise<string>;
  fileExists(filePath: string): Promise<void>;
}

// System Prompt Templates (OpenCode-inspired)
const ANTHROPIC_SYSTEM_HEADER = `You are Claude, an AI assistant created by Anthropic. You are operating through Open CLI, a command-line interface that enables sophisticated AI-powered development workflows.`;

const CLAUDE_SYSTEM_PROMPT = `You are Claude Code, optimized for software engineering tasks through Open CLI.

IMPORTANT: Assist with defensive security tasks only. Refuse to create, modify, or improve code that may be used maliciously. Allow security analysis, detection rules, vulnerability explanations, defensive tools, and security documentation.

# Task Management
You have access to sophisticated tools to help you manage and track tasks. Use these tools frequently to ensure comprehensive task completion and give users visibility into your progress.

# Code Excellence
- Follow established patterns and conventions in the codebase
- Prefer editing existing files over creating new ones
- Write clean, maintainable, well-documented code
- Consider performance implications of your changes
- Always validate your changes work correctly

# Security & Best Practices
- Never expose or log secrets and API keys
- Follow principle of least privilege
- Validate inputs and handle errors gracefully
- Use secure coding practices appropriate to the language and framework`;

const GPT_SYSTEM_PROMPT = `You are an expert software engineer and programming assistant, operating through Open CLI, a sophisticated command-line interface for AI-powered development.

You are world-class at:
- Software architecture and design patterns
- Code optimization and performance tuning  
- Debugging complex issues
- API design and implementation
- Testing strategies and implementation
- Documentation and code maintainability

Always strive for:
- Clean, readable, maintainable code
- Proper error handling and edge case consideration
- Security best practices
- Performance optimization where appropriate
- Comprehensive testing coverage`;

const GEMINI_SYSTEM_PROMPT = `You are an AI assistant specialized in software development and programming tasks, powered by Google's Gemini and accessed through Open CLI.

Your capabilities include:
- Code analysis, generation, and optimization
- Multi-language programming support
- Architecture design and system planning
- Code review and improvement suggestions
- Testing and debugging assistance
- Documentation generation

Focus on:
- Writing efficient, maintainable code
- Following language-specific best practices
- Providing clear explanations of your reasoning
- Suggesting improvements and optimizations
- Ensuring code security and reliability`;

const QWEN_SYSTEM_PROMPT = `You are Qwen, a large language model developed by Alibaba Cloud, operating through Open CLI for software development tasks.

You excel at:
- Code understanding and generation across multiple programming languages
- Problem-solving and algorithmic thinking
- System design and architecture planning
- Code review and optimization suggestions
- Documentation and explanation of complex concepts

Your approach:
- Analyze problems thoroughly before implementing solutions
- Write clean, efficient, and well-documented code
- Consider edge cases and error handling
- Suggest best practices and improvements
- Explain your reasoning clearly`;

const DEFAULT_SYSTEM_PROMPT = `You are an AI programming assistant operating through Open CLI, designed to help with software development tasks.

Your role includes:
- Writing, reviewing, and improving code
- Explaining complex programming concepts
- Helping with debugging and troubleshooting
- Suggesting architectural improvements
- Assisting with testing and documentation

Best practices:
- Write clean, readable, and maintainable code
- Follow established conventions and patterns
- Handle errors gracefully and securely
- Provide clear explanations of your changes
- Consider performance and security implications`;

const PLAN_MODE_ADDITION = `
# Plan Mode Active

You are currently in plan mode. Your task is to create a detailed implementation plan rather than immediately writing code. 

Your plan should include:
- Step-by-step breakdown of the implementation
- Key architectural decisions and rationale
- Potential challenges and mitigation strategies
- Testing and validation approach
- Timeline and dependency considerations

Present your plan clearly and ask for approval before proceeding with implementation.`;