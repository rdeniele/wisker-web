/**
 * Embedding Service
 * Handles text embedding generation using Together AI embedding models
 * for semantic search and retrieval
 */

import { AIProcessingError } from "@/lib/errors";

interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class EmbeddingService {
  private apiKey: string;
  private model: string;
  private baseURL: string = "https://api.together.xyz/v1";
  private embeddingDimension: number = 1024;
  private maxInputTokens: number = 512;

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || "";
    // Together AI supports multiple embedding models
    this.model = process.env.TOGETHER_AI_EMBEDDING_MODEL || "BAAI/bge-large-en-v1.5";

    if (!this.apiKey) {
      console.warn("TOGETHER_API_KEY not found in environment variables");
    }
  }

  /**
   * Truncate text to fit within token limits
   * Rough estimate: 1 token ≈ 4 characters for English text
   */
  private truncateText(text: string): string {
    const maxChars = this.maxInputTokens * 4;
    if (text.length <= maxChars) {
      return text;
    }

    // Truncate at sentence boundary if possible
    const truncated = text.substring(0, maxChars);
    const lastSentence = Math.max(
      truncated.lastIndexOf(". "),
      truncated.lastIndexOf("! "),
      truncated.lastIndexOf("? ")
    );

    if (lastSentence > maxChars * 0.7) {
      return truncated.substring(0, lastSentence + 1);
    }

    return truncated;
  }

  /**
   * Generate embedding for a single text chunk using Together AI
   */
  async generateEmbedding(
    text: string,
    instruction?: string
  ): Promise<number[]> {
    if (!this.apiKey) {
      throw new AIProcessingError("Together AI API key not configured");
    }

    try {
      // Prepare text
      const truncatedText = this.truncateText(text);
      const inputText = instruction ? `${instruction}: ${truncatedText}` : truncatedText;

      // Call Together AI Embeddings API
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: inputText,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Embedding API error:", errorText);

        if (response.status === 503) {
          throw new AIProcessingError(
            "Embedding service is temporarily unavailable. Retrying..."
          );
        }

        throw new AIProcessingError(
          `Failed to generate embedding: ${response.status} ${errorText}`
        );
      }

      const data: EmbeddingResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new AIProcessingError("No embedding returned from API");
      }

      const embedding = data.data[0].embedding;

      if (!Array.isArray(embedding)) {
        console.error("Unexpected embedding response format:", data);
        throw new AIProcessingError("Invalid embedding response format");
      }

      // Update dimension if different
      if (embedding.length !== this.embeddingDimension) {
        this.embeddingDimension = embedding.length;
      }

      return embedding;
    } catch (error) {
      if (error instanceof AIProcessingError) {
        throw error;
      }

      console.error("Failed to generate embedding:", error);
      throw new AIProcessingError(
        "Failed to generate text embedding",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate embeddings for multiple text chunks in batch
   * Together AI supports batch embedding requests
   */
  async generateBatchEmbeddings(
    texts: string[],
    instruction?: string
  ): Promise<number[][]> {
    if (!this.apiKey) {
      throw new AIProcessingError("Together AI API key not configured");
    }

    if (texts.length === 0) {
      return [];
    }

    try {
      // Prepare texts
      const inputTexts = texts.map((text) => {
        const truncated = this.truncateText(text);
        return instruction ? `${instruction}: ${truncated}` : truncated;
      });

      // Call Together AI Embeddings API with batch
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: inputTexts,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIProcessingError(
          `Failed to generate batch embeddings: ${response.status} ${errorText}`
        );
      }

      const data: EmbeddingResponse = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new AIProcessingError("No embeddings returned from API");
      }

      // Sort by index to ensure correct order
      const sortedData = data.data.sort((a, b) => a.index - b.index);
      return sortedData.map((item) => item.embedding);
    } catch (error) {
      if (error instanceof AIProcessingError) {
        throw error;
      }

      console.error("Failed to generate batch embeddings:", error);
      throw new AIProcessingError(
        "Failed to generate batch embeddings",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate embeddings for document chunks
   */
  async generateDocumentEmbeddings(
    documents: string[]
  ): Promise<number[][]> {
    return this.generateBatchEmbeddings(
      documents,
      "Represent this study material for semantic search"
    );
  }

  /**
   * Generate embeddings for search queries
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    const embeddings = await this.generateBatchEmbeddings(
      [query],
      "Represent this search query for retrieving relevant study materials"
    );
    return embeddings[0];
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have the same dimension");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Find most similar chunks to a query
   */
  static findMostSimilar(
    queryEmbedding: number[],
    chunkEmbeddings: Array<{ id: string; embedding: number[] }>,
    topK: number = 10,
    threshold: number = 0.7
  ): Array<{ id: string; similarity: number }> {
    const similarities = chunkEmbeddings
      .map((chunk) => ({
        id: chunk.id,
        similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .filter((item) => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return similarities;
  }

  /**
   * Retry wrapper for handling transient errors
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on specific errors
        if (
          error instanceof AIProcessingError &&
          error.message.includes("temporarily unavailable")
        ) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(
            `Embedding generation failed, retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Non-retryable error
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Health check for the embedding service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testEmbedding = await this.generateEmbedding(
        "This is a test sentence."
      );
      return testEmbedding.length === this.embeddingDimension;
    } catch (error) {
      console.error("Embedding service health check failed:", error);
      return false;
    }
  }

  /**
   * Get embedding dimension
   */
  getEmbeddingDimension(): number {
    return this.embeddingDimension;
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.model;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
