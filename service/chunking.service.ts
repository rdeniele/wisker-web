/**
 * Chunking Service
 * Handles intelligent text chunking for knowledge base creation
 * Splits large documents into semantic chunks while preserving context
 */

export interface ChunkMetadata {
  pageNumber?: number;
  startPosition: number;
  endPosition: number;
  sectionType?: string;
  hasImages: boolean;
  keyTerms: string[];
}

export interface TextChunk {
  chunkIndex: number;
  content: string;
  heading?: string;
  metadata: ChunkMetadata;
}

export interface ChunkingConfig {
  maxChunkSize: number; // in tokens
  overlap: number; // token overlap between chunks
  minChunkSize: number; // minimum viable chunk
  preserveContext: boolean; // keep section headers
  semanticSplit: boolean; // split at paragraph/sentence boundaries
}

const DEFAULT_CONFIG: ChunkingConfig = {
  maxChunkSize: 1000,
  overlap: 200,
  minChunkSize: 100,
  preserveContext: true,
  semanticSplit: true,
};

export class ChunkingService {
  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Extract headings from text (Markdown style)
   */
  private static extractHeadings(text: string): Array<{
    level: number;
    text: string;
    position: number;
  }> {
    const headings: Array<{ level: number; text: string; position: number }> =
      [];
    const lines = text.split("\n");
    let currentPosition = 0;

    for (const line of lines) {
      // Match Markdown headings (# Header)
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          position: currentPosition,
        });
      }
      currentPosition += line.length + 1; // +1 for newline
    }

    return headings;
  }

  /**
   * Extract key terms from text (simple frequency-based approach)
   */
  private static extractKeyTerms(text: string, maxTerms: number = 10): string[] {
    // Remove common words (stopwords)
    const stopwords = new Set([
      "the",
      "is",
      "at",
      "which",
      "on",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "with",
      "to",
      "for",
      "of",
      "as",
      "from",
      "by",
      "that",
      "this",
      "it",
      "are",
      "was",
      "were",
      "been",
      "be",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "should",
      "could",
      "may",
      "might",
      "can",
    ]);

    // Extract words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(
        (word) => word.length > 3 && !stopwords.has(word) && !/^\d+$/.test(word)
      );

    // Count frequency
    const frequency: Record<string, number> = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    // Sort by frequency and return top terms
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTerms)
      .map(([word]) => word);
  }

  /**
   * Split text at semantic boundaries (paragraphs, sentences)
   */
  private static splitAtBoundary(
    text: string,
    maxSize: number
  ): { text: string; endPos: number } {
    if (text.length <= maxSize) {
      return { text, endPos: text.length };
    }

    // Try to split at paragraph boundary (double newline)
    const paragraphEnd = text.lastIndexOf("\n\n", maxSize);
    if (paragraphEnd > maxSize * 0.7) {
      return { text: text.substring(0, paragraphEnd), endPos: paragraphEnd };
    }

    // Try to split at sentence boundary
    const sentenceEnd = Math.max(
      text.lastIndexOf(". ", maxSize),
      text.lastIndexOf("! ", maxSize),
      text.lastIndexOf("? ", maxSize)
    );
    if (sentenceEnd > maxSize * 0.7) {
      return {
        text: text.substring(0, sentenceEnd + 1),
        endPos: sentenceEnd + 1,
      };
    }

    // Try to split at newline
    const newlineEnd = text.lastIndexOf("\n", maxSize);
    if (newlineEnd > maxSize * 0.7) {
      return { text: text.substring(0, newlineEnd), endPos: newlineEnd };
    }

    // Fallback: split at space
    const spaceEnd = text.lastIndexOf(" ", maxSize);
    if (spaceEnd > 0) {
      return { text: text.substring(0, spaceEnd), endPos: spaceEnd };
    }

    // Last resort: hard cut
    return { text: text.substring(0, maxSize), endPos: maxSize };
  }

  /**
   * Create chunks with overlap
   */
  private static splitWithOverlap(
    text: string,
    maxChunkSize: number,
    overlap: number,
    semanticSplit: boolean = true
  ): Array<{ content: string; startPos: number; endPos: number }> {
    const chunks: Array<{ content: string; startPos: number; endPos: number }> = [];
    const maxChars = maxChunkSize * 4; // Convert tokens to chars
    const overlapChars = overlap * 4;

    let startPos = 0;

    while (startPos < text.length) {
      const remainingText = text.substring(startPos);

      if (semanticSplit) {
        const { text: chunkText, endPos } = this.splitAtBoundary(
          remainingText,
          maxChars
        );
        chunks.push({
          content: chunkText.trim(),
          startPos,
          endPos: startPos + endPos,
        });
        startPos += Math.max(endPos - overlapChars, 1);
      } else {
        const chunkText = remainingText.substring(0, maxChars);
        chunks.push({
          content: chunkText.trim(),
          startPos,
          endPos: startPos + chunkText.length,
        });
        startPos += Math.max(maxChars - overlapChars, 1);
      }
    }

    return chunks;
  }

  /**
   * Create semantic chunks from text content
   */
  static createChunks(
    rawContent: string,
    config: Partial<ChunkingConfig> = {}
  ): TextChunk[] {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    // Extract headings for section detection
    const headings = this.extractHeadings(rawContent);

    // If no headings, treat entire content as one section
    if (headings.length === 0) {
      const textChunks = this.splitWithOverlap(
        rawContent,
        finalConfig.maxChunkSize,
        finalConfig.overlap,
        finalConfig.semanticSplit
      );

      for (const chunk of textChunks) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: chunk.content,
          heading: undefined,
          metadata: {
            startPosition: chunk.startPos,
            endPosition: chunk.endPos,
            hasImages: false,
            keyTerms: this.extractKeyTerms(chunk.content),
          },
        });
      }

      return chunks;
    }

    // Split by sections (headings)
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextHeading = headings[i + 1];

      // Extract section content
      const sectionStart = heading.position;
      const sectionEnd = nextHeading ? nextHeading.position : rawContent.length;
      const sectionContent = rawContent
        .substring(sectionStart, sectionEnd)
        .trim();

      // Remove the heading line from content
      const contentWithoutHeading = sectionContent
        .replace(/^#{1,6}\s+.+\n/, "")
        .trim();

      const sectionTokens = this.estimateTokens(contentWithoutHeading);

      // If section fits in one chunk, keep it together
      if (sectionTokens <= finalConfig.maxChunkSize) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: contentWithoutHeading,
          heading: heading.text,
          metadata: {
            startPosition: sectionStart,
            endPosition: sectionEnd,
            sectionType: `h${heading.level}`,
            hasImages: /!\[.*?\]\(.*?\)/.test(sectionContent),
            keyTerms: this.extractKeyTerms(contentWithoutHeading),
          },
        });
      } else {
        // Split large sections into overlapping chunks
        const textChunks = this.splitWithOverlap(
          contentWithoutHeading,
          finalConfig.maxChunkSize,
          finalConfig.overlap,
          finalConfig.semanticSplit
        );

        for (const chunk of textChunks) {
          // Prepend heading if preserving context
          const finalContent = finalConfig.preserveContext
            ? `${heading.text}\n\n${chunk.content}`
            : chunk.content;

          chunks.push({
            chunkIndex: chunkIndex++,
            content: finalContent,
            heading: heading.text,
            metadata: {
              startPosition: sectionStart + chunk.startPos,
              endPosition: sectionStart + chunk.endPos,
              sectionType: `h${heading.level}`,
              hasImages: /!\[.*?\]\(.*?\)/.test(chunk.content),
              keyTerms: this.extractKeyTerms(chunk.content),
            },
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Chunk for specific page-based content (e.g., PDFs)
   */
  static createPageBasedChunks(
    pages: Array<{ pageNumber: number; content: string; hasImages: boolean }>,
    config: Partial<ChunkingConfig> = {}
  ): TextChunk[] {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    for (const page of pages) {
      const pageTokens = this.estimateTokens(page.content);

      if (pageTokens <= finalConfig.maxChunkSize) {
        // Page fits in one chunk
        chunks.push({
          chunkIndex: chunkIndex++,
          content: page.content,
          metadata: {
            pageNumber: page.pageNumber,
            startPosition: 0,
            endPosition: page.content.length,
            hasImages: page.hasImages,
            keyTerms: this.extractKeyTerms(page.content),
          },
        });
      } else {
        // Split large page into chunks
        const textChunks = this.splitWithOverlap(
          page.content,
          finalConfig.maxChunkSize,
          finalConfig.overlap,
          finalConfig.semanticSplit
        );

        for (const chunk of textChunks) {
          chunks.push({
            chunkIndex: chunkIndex++,
            content: chunk.content,
            metadata: {
              pageNumber: page.pageNumber,
              startPosition: chunk.startPos,
              endPosition: chunk.endPos,
              hasImages: page.hasImages,
              keyTerms: this.extractKeyTerms(chunk.content),
            },
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Validate and clean chunk content
   */
  static validateChunk(chunk: TextChunk): boolean {
    const tokens = this.estimateTokens(chunk.content);
    return tokens >= DEFAULT_CONFIG.minChunkSize && chunk.content.trim().length > 0;
  }

  /**
   * Get chunk statistics
   */
  static getChunkStats(chunks: TextChunk[]): {
    totalChunks: number;
    totalTokens: number;
    avgTokensPerChunk: number;
    minTokens: number;
    maxTokens: number;
  } {
    const tokenCounts = chunks.map((c) => this.estimateTokens(c.content));
    const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0);

    return {
      totalChunks: chunks.length,
      totalTokens,
      avgTokensPerChunk: Math.round(totalTokens / chunks.length),
      minTokens: Math.min(...tokenCounts),
      maxTokens: Math.max(...tokenCounts),
    };
  }
}
