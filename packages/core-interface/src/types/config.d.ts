/**
 * Configuration type definitions
 */
export interface AdapterConfig {
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
    retries?: number;
    [key: string]: unknown;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
//# sourceMappingURL=config.d.ts.map