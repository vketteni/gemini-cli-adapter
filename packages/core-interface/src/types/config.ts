/**
 * Configuration type definitions
 */

export enum AuthType {
  API_KEY = 'api_key',
  OAUTH = 'oauth',
  SERVICE_ACCOUNT = 'service_account'
}

export enum UserTierId {
  FREE = 'free',
  PAID = 'paid',
  ENTERPRISE = 'enterprise'
}

export enum EditorType {
  VSCODE = 'vscode',
  CURSOR = 'cursor',
  JETBRAINS = 'jetbrains',
  NEOVIM = 'neovim',
  OTHER = 'other'
}

export enum IDEConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export enum ApprovalMode {
  ALWAYS_ASK = 'always_ask',
  AUTO_APPROVE = 'auto_approve',
  NEVER_ALLOW = 'never_allow'
}

export interface AdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  authType?: AuthType;
  userTier?: UserTierId;
  approvalMode?: ApprovalMode;
  [key: string]: unknown;
}

export interface SandboxConfig {
  enabled: boolean;
  restrictions: string[];
  allowedPaths: string[];
  deniedPaths: string[];
}

export interface CodeAssistServer {
  url: string;
  apiKey?: string;
  timeout?: number;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
