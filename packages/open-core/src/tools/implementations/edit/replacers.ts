/**
 * @license
 * Copyright 2025 Open CLI Contributors  
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Multi-strategy replacement system inspired by OpenCode (https://github.com/sst/opencode)
 * - MIT licensed, implementation patterns adapted for Open CLI
 */

/**
 * Advanced string replacement strategies inspired by OpenCode
 * 
 * This implements multiple fallback strategies for robust file editing,
 * allowing the edit tool to handle various whitespace and formatting scenarios.
 */

export interface Replacer {
  name: string;
  findMatches(content: string, searchText: string): string[];
}

/**
 * Simple exact string replacement
 */
export class SimpleReplacer implements Replacer {
  name = 'Simple';

  findMatches(content: string, searchText: string): string[] {
    return content.includes(searchText) ? [searchText] : [];
  }
}

/**
 * Line-by-line trimmed matching - handles whitespace differences
 */
export class LineTrimmedReplacer implements Replacer {
  name = 'LineTrimmed';

  findMatches(content: string, searchText: string): string[] {
    const contentLines = content.split('\n');
    const searchLines = searchText.split('\n');
    
    if (searchLines.length === 1) {
      // Single line - look for trimmed matches
      const trimmedSearch = searchLines[0].trim();
      for (let i = 0; i < contentLines.length; i++) {
        if (contentLines[i].trim() === trimmedSearch) {
          return [contentLines[i]];
        }
      }
      return [];
    }

    // Multi-line search with trimmed comparison
    for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
      let match = true;
      for (let j = 0; j < searchLines.length; j++) {
        if (contentLines[i + j].trim() !== searchLines[j].trim()) {
          match = false;
          break;
        }
      }
      
      if (match) {
        const matchLines = contentLines.slice(i, i + searchLines.length);
        return [matchLines.join('\n')];
      }
    }

    return [];
  }
}

/**
 * Block anchor replacement - uses first and last lines as anchors (OpenCode pattern)
 */
export class BlockAnchorReplacer implements Replacer {
  name = 'BlockAnchor';
  private readonly SIMILARITY_THRESHOLD = 0.7;

  findMatches(content: string, searchText: string): string[] {
    const originalLines = content.split('\n');
    const searchLines = searchText.split('\n');

    if (searchLines.length < 3) return []; // Need at least 3 lines for anchoring

    const firstLineSearch = searchLines[0].trim();
    const lastLineSearch = searchLines[searchLines.length - 1].trim();

    // Find candidates where both anchors match
    const candidates: Array<{ startLine: number; endLine: number }> = [];
    
    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i].trim() !== firstLineSearch) continue;

      for (let j = i + 2; j < originalLines.length; j++) {
        if (originalLines[j].trim() === lastLineSearch) {
          candidates.push({ startLine: i, endLine: j });
          break;
        }
      }
    }

    if (candidates.length === 0) return [];
    if (candidates.length === 1) {
      return [this.extractBlock(originalLines, candidates[0])];
    }

    // Multiple candidates - use similarity scoring
    let bestMatch: { startLine: number; endLine: number } | null = null;
    let maxSimilarity = -1;

    for (const candidate of candidates) {
      const similarity = this.calculateSimilarity(
        originalLines, 
        searchLines, 
        candidate.startLine, 
        candidate.endLine
      );

      if (similarity > maxSimilarity && similarity >= this.SIMILARITY_THRESHOLD) {
        maxSimilarity = similarity;
        bestMatch = candidate;
      }
    }

    return bestMatch ? [this.extractBlock(originalLines, bestMatch)] : [];
  }

  private extractBlock(lines: string[], range: { startLine: number; endLine: number }): string {
    return lines.slice(range.startLine, range.endLine + 1).join('\n');
  }

  private calculateSimilarity(
    originalLines: string[], 
    searchLines: string[], 
    startLine: number, 
    endLine: number
  ): number {
    const actualBlockSize = endLine - startLine + 1;
    const linesToCheck = Math.min(searchLines.length - 2, actualBlockSize - 2);
    
    if (linesToCheck <= 0) return 1.0;

    let totalSimilarity = 0;
    
    for (let j = 1; j < searchLines.length - 1 && j < actualBlockSize - 1; j++) {
      const originalLine = originalLines[startLine + j].trim();
      const searchLine = searchLines[j].trim();
      const similarity = this.calculateLineSimilarity(originalLine, searchLine);
      totalSimilarity += similarity;
    }

    return totalSimilarity / linesToCheck;
  }

  private calculateLineSimilarity(line1: string, line2: string): number {
    if (line1 === line2) return 1.0;
    
    const maxLen = Math.max(line1.length, line2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(line1, line2);
    return 1 - (distance / maxLen);
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a === '' || b === '') {
      return Math.max(a.length, b.length);
    }

    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[a.length][b.length];
  }
}

/**
 * Whitespace-normalized replacement - handles different whitespace patterns
 */
export class WhitespaceNormalizedReplacer implements Replacer {
  name = 'WhitespaceNormalized';

  findMatches(content: string, searchText: string): string[] {
    const normalizedContent = this.normalizeWhitespace(content);
    const normalizedSearch = this.normalizeWhitespace(searchText);
    
    const startIndex = normalizedContent.indexOf(normalizedSearch);
    if (startIndex === -1) return [];

    // Find the corresponding original text
    const beforeNormalized = normalizedContent.substring(0, startIndex);
    const matchNormalized = normalizedContent.substring(startIndex, startIndex + normalizedSearch.length);
    
    // Map back to original content
    let originalIndex = 0;
    let normalizedIndex = 0;
    
    // Skip to start position
    while (normalizedIndex < beforeNormalized.length) {
      if (this.normalizeChar(content[originalIndex]) === beforeNormalized[normalizedIndex]) {
        normalizedIndex++;
      }
      originalIndex++;
    }
    
    const matchStart = originalIndex;
    
    // Find match end
    normalizedIndex = 0;
    while (normalizedIndex < matchNormalized.length) {
      if (this.normalizeChar(content[originalIndex]) === matchNormalized[normalizedIndex]) {
        normalizedIndex++;
      }
      originalIndex++;
    }
    
    const matchEnd = originalIndex;
    
    return [content.substring(matchStart, matchEnd)];
  }

  private normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private normalizeChar(char: string): string {
    return /\s/.test(char) ? ' ' : char;
  }
}

/**
 * Indentation-flexible replacement - handles different indentation levels
 */
export class IndentationFlexibleReplacer implements Replacer {
  name = 'IndentationFlexible';

  findMatches(content: string, searchText: string): string[] {
    const contentLines = content.split('\n');
    const searchLines = searchText.split('\n');
    
    for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
      const potentialMatch = this.checkIndentationMatch(
        contentLines.slice(i, i + searchLines.length),
        searchLines
      );
      
      if (potentialMatch) {
        return [potentialMatch];
      }
    }

    return [];
  }

  private checkIndentationMatch(contentLines: string[], searchLines: string[]): string | null {
    if (contentLines.length !== searchLines.length) return null;

    // Determine base indentation from first non-empty line
    const firstNonEmptyContent = contentLines.find(line => line.trim());
    const firstNonEmptySearch = searchLines.find(line => line.trim());
    
    if (!firstNonEmptyContent || !firstNonEmptySearch) return null;

    const contentBaseIndent = this.getIndentation(firstNonEmptyContent);
    const searchBaseIndent = this.getIndentation(firstNonEmptySearch);

    // Check if all lines match with adjusted indentation
    for (let i = 0; i < searchLines.length; i++) {
      const searchLine = searchLines[i];
      const contentLine = contentLines[i];
      
      if (searchLine.trim() === '') {
        // Empty lines should match empty lines
        if (contentLine.trim() !== '') return null;
        continue;
      }
      
      const searchIndent = this.getIndentation(searchLine);
      const expectedIndent = contentBaseIndent.length + (searchIndent.length - searchBaseIndent.length);
      const expectedLine = ' '.repeat(Math.max(0, expectedIndent)) + searchLine.trim();
      
      if (contentLine !== expectedLine) return null;
    }

    return contentLines.join('\n');
  }

  private getIndentation(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }
}

/**
 * Escape sequence normalized replacement - handles different escape patterns
 */
export class EscapeNormalizedReplacer implements Replacer {
  name = 'EscapeNormalized';

  findMatches(content: string, searchText: string): string[] {
    const normalizedContent = this.normalizeEscapes(content);
    const normalizedSearch = this.normalizeEscapes(searchText);
    
    if (normalizedContent.includes(normalizedSearch)) {
      // Find the original text that matches
      const startIndex = normalizedContent.indexOf(normalizedSearch);
      return [this.mapBackToOriginal(content, startIndex, normalizedSearch.length)];
    }

    return [];
  }

  private normalizeEscapes(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }

  private mapBackToOriginal(original: string, normalizedStart: number, normalizedLength: number): string {
    // This is a simplified mapping - in practice, you'd want more sophisticated tracking
    let originalIndex = 0;
    let normalizedIndex = 0;
    
    // Find start position
    while (normalizedIndex < normalizedStart && originalIndex < original.length) {
      if (original.substring(originalIndex, originalIndex + 2) === '\\n') {
        originalIndex += 2;
        normalizedIndex += 1;
      } else if (original.substring(originalIndex, originalIndex + 2) === '\\t') {
        originalIndex += 2;
        normalizedIndex += 1;
      } else if (original.substring(originalIndex, originalIndex + 2) === '\\\\') {
        originalIndex += 2;
        normalizedIndex += 1;
      } else {
        originalIndex++;
        normalizedIndex++;
      }
    }
    
    const startIndex = originalIndex;
    
    // Find end position
    let remainingLength = normalizedLength;
    while (remainingLength > 0 && originalIndex < original.length) {
      if (original.substring(originalIndex, originalIndex + 2) === '\\n') {
        originalIndex += 2;
        remainingLength -= 1;
      } else if (original.substring(originalIndex, originalIndex + 2) === '\\t') {
        originalIndex += 2;
        remainingLength -= 1;
      } else if (original.substring(originalIndex, originalIndex + 2) === '\\\\') {
        originalIndex += 2;
        remainingLength -= 1;
      } else {
        originalIndex++;
        remainingLength -= 1;
      }
    }
    
    return original.substring(startIndex, originalIndex);
  }
}

/**
 * Main replacement function that tries all strategies (OpenCode pattern)
 */
export function replaceWithStrategies(
  content: string,
  oldString: string,
  newString: string,
  replaceAll = false
): { result: string; strategy: string } {
  if (oldString === newString) {
    throw new Error('oldString and newString must be different');
  }

  const replacers: Replacer[] = [
    new SimpleReplacer(),
    new LineTrimmedReplacer(),
    new BlockAnchorReplacer(),
    new WhitespaceNormalizedReplacer(),
    new IndentationFlexibleReplacer(),
    new EscapeNormalizedReplacer(),
  ];

  for (const replacer of replacers) {
    try {
      const matches = replacer.findMatches(content, oldString);
      
      if (matches.length === 0) continue;
      
      if (matches.length === 1 || replaceAll) {
        const searchString = matches[0];
        let result: string;
        
        if (replaceAll) {
          result = content.split(searchString).join(newString);
        } else {
          const index = content.indexOf(searchString);
          if (index === -1) continue;
          
          // Ensure uniqueness for non-replaceAll operations
          const lastIndex = content.lastIndexOf(searchString);
          if (index !== lastIndex) continue;
          
          result = content.substring(0, index) + 
                   newString + 
                   content.substring(index + searchString.length);
        }
        
        return { result, strategy: replacer.name };
      }
    } catch (error) {
      // Continue to next strategy if current one fails
      continue;
    }
  }

  throw new Error(
    'Could not find unique match for replacement. ' +
    'The search text was either not found or appeared multiple times. ' +
    'Try using a more specific search text or set replaceAll=true.'
  );
}