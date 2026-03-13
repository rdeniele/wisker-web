/**
 * Kimi K2.5 Service (via Together AI)
 * Handles advanced content generation with multimodal reasoning
 * Used for: Structured notes, Flashcards, Quizzes, Summaries
 */

import { AIProcessingError } from "@/lib/errors";
import {
  OrganizedNoteContent,
  QuizContent,
  FlashcardContent,
  SummaryContent,
} from "@/types/api";

interface KimiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface KimiRequest {
  model: string;
  messages: KimiMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  repetition_penalty?: number;
  stop?: string[];
}

interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class KimiService {
  private apiKey: string;
  private model: string;
  private baseURL: string = "https://api.together.xyz/v1";
  private maxContextTokens: number = 128000;

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || "";
    this.model = process.env.TOGETHER_AI_KIMI_MODEL || "moonshotai/Kimi-K2.5";

    if (!this.apiKey) {
      console.warn(
        "TOGETHER_API_KEY not found in environment variables. Kimi K2.5 will not be available."
      );
    }
  }

  /**
   * Make request to Kimi API (via Together AI) with retry logic
   */
  private async makeRequest(
    messages: KimiMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new AIProcessingError("Together AI API key not configured");
    }

    const requestBody: KimiRequest = {
      model: this.model,
      messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 8000,
      top_p: 0.95,
      repetition_penalty: 1.0,
      stop: ["<|im_end|>", "<|endoftext|>"],
    };

    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          const isRetryable =
            response.status === 503 || response.status === 429;

          if (isRetryable && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(
              `Kimi K2.5 API ${response.status} error. Retrying in ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          throw new AIProcessingError(
            `Kimi K2.5 API error: ${response.status} ${errorText}`
          );
        }

        const data: KimiResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
          throw new AIProcessingError("No response from Kimi K2.5");
        }

        return data.choices[0].message.content;
      } catch (error) {
        if (
          attempt === maxRetries ||
          !(error instanceof Error && error.message.includes("503"))
        ) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new AIProcessingError("Failed to get response from Kimi K2.5");
  }

  /**
   * Parse JSON response from Kimi
   */
  private parseJSONResponse(content: string): any {
    try {
      let cleanContent = content.trim();

      // Extract JSON from markdown code blocks
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

      // Find JSON boundaries if needed
      if (!cleanContent.startsWith("{") && !cleanContent.startsWith("[")) {
        const jsonStart = cleanContent.indexOf("{");
        const jsonEnd = cleanContent.lastIndexOf("}");

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
      }

      // Remove trailing commas
      cleanContent = cleanContent.replace(/,(\s*[}\]])/g, "$1");

      return JSON.parse(cleanContent);
    } catch (error) {
      console.error("Failed to parse Kimi response:", error);
      console.error("Content:", content.substring(0, 500));
      throw new AIProcessingError("Failed to parse Kimi response as JSON");
    }
  }

  /**
   * Generate structured notes from knowledge base chunks
   */
  async generateStructuredNotes(
    aggregatedContent: string,
    metadata?: {
      title?: string;
      subject?: string;
    }
  ): Promise<OrganizedNoteContent> {
    const systemPrompt = `You are an expert educational content organizer with deep pedagogical knowledge. 
Analyze study materials and create comprehensive, well-structured notes optimized for learning.

Your notes should:
- Have clear hierarchical structure with main sections and subsections
- Identify and highlight key concepts and terminology
- Include explanations with examples where relevant
- Provide study tips and connections between topics
- Be thorough yet concise

Return JSON format:
{
  "title": "Clear, descriptive title",
  "sections": [
    {
      "heading": "Main topic heading",
      "content": "Detailed explanation with examples",
      "keyPoints": ["Important point 1", "Important point 2"],
      "subSections": [
        {
          "heading": "Subtopic",
          "content": "Detailed content for subtopic"
        }
      ]
    }
  ],
  "highlights": ["Critical concept to remember"],
  "summary": "Comprehensive overview of all content",
  "studyTips": ["Effective way to learn this material"],
  "relatedTopics": ["Related concepts to explore"]
}`;

    const userPrompt = `Create structured study notes${metadata?.subject ? ` for ${metadata.subject}` : ""}:

${aggregatedContent}`;

    const messages: KimiMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.makeRequest(messages, {
      temperature: 0.3,
      maxTokens: 8000,
    });

    const parsed = this.parseJSONResponse(response);
    return parsed as OrganizedNoteContent;
  }

  /**
   * Generate flashcards for active recall
   */
  async generateFlashcards(
    content: string,
    options: {
      count?: number;
      difficulty?: "easy" | "medium" | "hard";
    } = {}
  ): Promise<FlashcardContent> {
    const { count = 15, difficulty = "medium" } = options;

    const systemPrompt = `You are a flashcard creation expert specializing in active recall and spaced repetition learning.

Generate ${count} ${difficulty} flashcards that:
- Test understanding, not just memorization
- Use clear, specific questions
- Provide complete but concise answers
- Include variety: definitions, explanations, applications, comparisons
- Follow the principle of atomic knowledge (one concept per card)
- Include hints for harder cards

Return JSON format:
{
  "cards": [
    {
      "id": 1,
      "front": "Clear, specific question or prompt",
      "back": "Concise answer with necessary context",
      "difficulty": "${difficulty}",
      "tags": ["topic", "concept-type"],
      "hint": "Optional hint for complex questions"
    }
  ],
  "metadata": {
    "totalCards": ${count},
    "topicsCovered": ["topic1", "topic2"],
    "difficultyDistribution": {"easy": 0, "medium": 0, "hard": 0}
  }
}`;

    const userPrompt = `Generate ${count} ${difficulty} flashcards from this study material:

${content}`;

    const messages: KimiMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.makeRequest(messages, {
      temperature: 0.4,
      maxTokens: 6000,
    });

    const parsed = this.parseJSONResponse(response);
    return parsed as FlashcardContent;
  }

  /**
   * Generate quiz questions with explanations
   */
  async generateQuiz(
    content: string,
    options: {
      questionCount?: number;
      difficulty?: "easy" | "medium" | "hard";
    } = {}
  ): Promise<QuizContent> {
    const { questionCount = 10, difficulty = "medium" } = options;

    const systemPrompt = `You are an expert educator creating assessment questions.

Generate ${questionCount} ${difficulty} multiple-choice questions that:
- Test comprehension and application, not just recall
- Have clear, unambiguous questions
- Include 4 plausible options
- Provide detailed explanations for correct answers
- Cover diverse aspects of the content
- Follow Bloom's taxonomy for ${difficulty} level

Return JSON format:
{
  "title": "Quiz title based on content",
  "questions": [
    {
      "id": 1,
      "question": "Clear question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct and others aren't",
      "difficulty": "${difficulty}",
      "topic": "Main topic area",
      "bloomsLevel": "Knowledge|Comprehension|Application|Analysis"
    }
  ]
}`;

    const userPrompt = `Create ${questionCount} ${difficulty} quiz questions from this material:

${content}`;

    const messages: KimiMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.makeRequest(messages, {
      temperature: 0.5,
      maxTokens: 8000,
    });

    const parsed = this.parseJSONResponse(response);
    return parsed as QuizContent;
  }

  /**
   * Generate summary
   */
  async generateSummary(
    content: string,
    summaryType: "brief" | "comprehensive" | "bullet" = "comprehensive"
  ): Promise<SummaryContent> {
    const summaryTypeDescriptions = {
      brief: "concise 200-word overview hitting only the main points",
      comprehensive: "detailed summary covering all major concepts and relationships",
      bullet: "structured bullet-point list of key concepts and facts",
    };

    const systemPrompt = `You are an expert at distilling complex information into clear summaries.

Create a ${summaryTypeDescriptions[summaryType]}.

Return JSON format:
{
  "title": "Summary of [topic]",
  "mainPoints": ["Main point 1", "Main point 2"],
  "summary": "Full summary text formatted appropriately",
  "keyTakeaways": ["Essential takeaway 1", "Essential takeaway 2"],
  "estimatedReadTime": 5
}`;

    const userPrompt = `Create a ${summaryType} summary of this study material:

${content}`;

    const messages: KimiMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.makeRequest(messages, {
      temperature: 0.3,
      maxTokens: 4000,
    });

    const parsed = this.parseJSONResponse(response);
    return parsed as SummaryContent;
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      model: this.model,
      maxContextTokens: this.maxContextTokens,
      isConfigured: this.isConfigured(),
    };
  }
}

// Export singleton instance
export const kimiService = new KimiService();
