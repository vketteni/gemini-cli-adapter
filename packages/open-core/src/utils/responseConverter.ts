/**
 * @license
 * Copyright 2025 Open CLI Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GenerateContentResponse, Part, Candidate } from '@google/genai';
import { ProviderResponse, ProviderPart, ProviderCandidate } from './partUtils.js';

/**
 * Convert Google GenerateContentResponse to provider-agnostic format
 */
export function convertGoogleResponse(response: GenerateContentResponse): ProviderResponse {
  return {
    candidates: response.candidates?.map(convertGoogleCandidate) || []
  };
}

/**
 * Convert Google Candidate to provider-agnostic format
 */
export function convertGoogleCandidate(candidate: Candidate): ProviderCandidate {
  return {
    content: {
      role: candidate.content?.role || 'model',
      parts: candidate.content?.parts?.map(convertGooglePart) || []
    },
    finishReason: candidate.finishReason
  };
}

/**
 * Convert Google Part to provider-agnostic format
 */
export function convertGooglePart(part: Part): ProviderPart {
  return {
    text: part.text,
    fileData: part.fileData ? {
      mimeType: part.fileData.mimeType || '',
      fileUri: part.fileData.fileUri || ''
    } : undefined,
    functionCall: part.functionCall ? {
      name: part.functionCall.name || 'unknown',
      args: part.functionCall.args || {}
    } : undefined,
    functionResponse: part.functionResponse ? {
      name: part.functionResponse.name || 'unknown',
      response: part.functionResponse.response
    } : undefined,
    inlineData: part.inlineData ? {
      mimeType: part.inlineData.mimeType || 'application/octet-stream',
      data: part.inlineData.data || ''
    } : undefined,
    // Extended fields
    videoMetadata: (part as any).videoMetadata,
    thought: (part as any).thought,
    codeExecutionResult: (part as any).codeExecutionResult,
    executableCode: (part as any).executableCode
  };
}

/**
 * Convert Google Parts array to provider-agnostic format
 */
export function convertGoogleParts(parts: Part[]): ProviderPart[] {
  return parts.map(convertGooglePart);
}

/**
 * Convert mixed PartListUnion from Google to provider format
 */
export function convertPartListUnion(value: any): string | ProviderPart | ProviderPart[] {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(convertGooglePart);
  }
  return convertGooglePart(value);
}