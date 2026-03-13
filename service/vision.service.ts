/**  
 * Vision Extraction Service
 * Handles document text + image extraction using Qwen3-VL-8B-Instruct multimodal model
 */

import { AIProcessingError } from "@/lib/errors";

interface VisionExtractionResult {
  pageNumber?: number;
  slideNumber?: number;
  textContent: string;
  visualElements: VisualElement[];
  structuredContent: {
    headings: string[];
    keyTerms: string[];
    concepts: string[];
  };
}

interface VisualElement {
  type: "diagram" | "chart" | "formula" | "table" | "image";
  description: string;
  position?: string;
  latex?: string; // For mathematical formulas
}

interface DocumentPage {
  pageNumber: number;
  imageUrl?: string;
  ocrText?: string;
  hasImages: boolean;
}

export class VisionExtractionService {
  private apiKey: string;
  private model: string;
  private baseURL = "https://api.together.xyz/v1";
  private maxTokens = 4096;

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || "";
    this.model =
      process.env.TOGETHER_AI_VISION_MODEL || "Qwen/Qwen3-VL-8B-Instruct";

    if (!this.apiKey) {
      console.warn("TOGETHER_API_KEY not found for vision extraction");
    }
  }

  /**
   * Extract text and visual content from a single document page/image
   */
  async extractFromImage(
    imageUrl: string,
    pageNumber?: number,
    ocrText?: string
  ): Promise<VisionExtractionResult> {
    if (!this.apiKey) {
      throw new AIProcessingError("Together AI API key not configured");
    }

    try {
      const systemPrompt = `You are an expert document analyzer with advanced vision capabilities. Your task is to:
1. Extract ALL text content visible in the image
2. Describe ALL visual elements (diagrams, charts, images, formulas, tables) in detail
3. Identify key concepts, headings, and important terms
4. Preserve structure, formatting, and relationships

Return your analysis as a JSON object with this structure:
{
  "textContent": "Full extracted text with preserved structure...",
  "visualElements": [
    {
      "type": "diagram|chart|formula|table|image",
      "description": "Detailed description of the visual element",
      "position": "location in page (e.g., 'center-top', 'bottom-left')",
      "latex": "LaTeX notation for formulas (if applicable)"
    }
  ],
  "structuredContent": {
    "headings": ["Title 1", "Section A"],
    "keyTerms": ["term1", "term2"],
    "concepts": ["Main concept described"]
  }
}

Be thorough and accurate. Extract everything visible.`;

      const userMessage: any[] = [
        {
          type: "text",
          text: `Extract and analyze all content from this document page:${pageNumber ? ` (Page ${pageNumber})` : ""}`,
        },
        {
          type: "image_url",
          image_url: { url: imageUrl },
        },
      ];

      // Include OCR text if available as additional context
      if (ocrText && ocrText.trim()) {
        userMessage.push({
          type: "text",
          text: `OCR-extracted text (use as reference, but verify against image):\n${ocrText}`,
        });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: this.maxTokens,
          temperature: 0.1, // Low temperature for accurate extraction
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AIProcessingError(
          `Vision extraction failed: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new AIProcessingError("No content returned from vision model");
      }

      // Parse JSON response
      const result = this.parseJSONResponse(content);

      return {
        pageNumber,
        ...result,
      } as VisionExtractionResult;
    } catch (error) {
      console.error("Vision extraction error:", error);
      throw new AIProcessingError(
        "Failed to extract content from image",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Extract content from multiple pages/slides
   */
  async extractFromMultiplePages(
    pages: DocumentPage[]
  ): Promise<VisionExtractionResult[]> {
    const results: VisionExtractionResult[] = [];

    for (const page of pages) {
      try {
        const result = await this.extractFromImage(
          page.imageUrl!,
          page.pageNumber,
          page.ocrText
        );
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to extract page ${page.pageNumber}:`, error);
        // Continue with other pages
        results.push({
          pageNumber: page.pageNumber,
          textContent: page.ocrText || "",
          visualElements: [],
          structuredContent: {
            headings: [],
            keyTerms: [],
            concepts: [],
          },
        });
      }
    }

    return results;
  }

  /**
   * Combine extraction results into a single document
   */
  static combineExtractions(
    extractions: VisionExtractionResult[]
  ): {
    fullText: string;
    allVisualElements: VisualElement[];
    extractedConcepts: string[];
  } {
    const fullText = extractions
      .map((ext) => {
        const pageHeader = ext.pageNumber
          ? `\n\n## Page ${ext.pageNumber}\n\n`
          : "\n\n";
        return pageHeader + ext.textContent;
      })
      .join("");

    const allVisualElements = extractions.flatMap(
      (ext) => ext.visualElements || []
    );

    const allConcepts = new Set<string>();
    extractions.forEach((ext) => {
      ext.structuredContent.concepts.forEach((concept) =>
        allConcepts.add(concept)
      );
      ext.structuredContent.keyTerms.forEach((term) => allConcepts.add(term));
    });

    return {
      fullText,
      allVisualElements,
      extractedConcepts: Array.from(allConcepts),
    };
  }

  /**
   * Parse JSON response from vision model
   */
  private parseJSONResponse(content: string): any {
    try {
      let cleanContent = content.trim();

      // Remove markdown code blocks
      const codeBlockMatch = cleanContent.match(
        /```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/
      );
      if (codeBlockMatch) {
        cleanContent = codeBlockMatch[1].trim();
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent
          .replace(/^```(?:json)?\s*/, "")
          .replace(/```\s*$/, "");
      }

      // Find JSON boundaries
      if (!cleanContent.startsWith("{") && !cleanContent.startsWith("[")) {
        const jsonStart = cleanContent.indexOf("{");
        const jsonEnd = cleanContent.lastIndexOf("}");

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
      }

      return JSON.parse(cleanContent.trim());
    } catch (error) {
      console.error("Failed to parse vision model response:", error);
      console.error("Content:", content.substring(0, 500));
      throw new AIProcessingError("Failed to parse vision model response");
    }
  }
}

// Export singleton instance
export const visionExtractionService = new VisionExtractionService();
