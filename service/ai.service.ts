import {
  OrganizedNoteContent,
  QuizContent,
  FlashcardContent,
  SummaryContent,
} from "@/types/api";
import { LearningToolType } from "@prisma/client";
import { AIProcessingError } from "@/lib/errors";
import { marked } from "marked";

interface TogetherAIMessage {
  role: "system" | "user" | "assistant";
  content: string | TogetherAIMessageContent[];
}

interface TogetherAIMessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

interface TogetherAIRequest {
  model: string;
  messages: TogetherAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repetition_penalty?: number;
  stop?: string[];
}

interface TogetherAIResponse {
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

/**
 * AI Service for processing notes and generating learning tools using Together AI
 */
// Helper function to convert Markdown to HTML for TipTap editor
function markdownToHtml(markdown: string): string {
  try {
    // Configure marked options
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
    });

    const html = marked.parse(markdown) as string;
    return html;
  } catch (error) {
    console.error("Failed to convert markdown to HTML:", error);
    // Fallback: return markdown wrapped in basic HTML
    return `<p>${markdown.replace(/\n/g, "<br>")}</p>`;
  }
}

export class AIService {
  private apiKey: string;
  private model: string;
  private visionModel: string;
  private baseURL = "https://api.together.xyz/v1";

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || "";
    // Use serverless model by default to avoid dedicated endpoint requirement
    this.model =
      process.env.TOGETHER_AI_MODEL ||
      "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
    this.visionModel =
      process.env.TOGETHER_AI_VISION_MODEL || "Qwen/Qwen3-VL-8B-Instruct";

    if (!this.apiKey) {
      console.warn("TOGETHER_API_KEY not found in environment variables");
    }
  }

  /**
   * Make a request to Together AI API with retry logic
   */
  private async makeRequest(
    messages: TogetherAIMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {},
    modelOverride?: string,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new AIProcessingError("Together AI API key not configured");
    }

    const requestBody: TogetherAIRequest = {
      model: modelOverride || this.model,
      messages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>", "<|eom_id|>"],
    };

    // Retry configuration
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

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

        // Check for retryable errors (503 Service Unavailable, 429 Too Many Requests)
        if (!response.ok) {
          const errorText = await response.text();
          const isRetryable =
            response.status === 503 || response.status === 429;

          if (isRetryable && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.warn(
              `Together AI API ${response.status} error. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue; // Retry
          }

          // Non-retryable error or max retries reached
          if (response.status === 503) {
            throw new AIProcessingError(
              "The AI service is temporarily unavailable. Please try again in a few minutes.",
            );
          }

          // Try to parse error response to get the actual message
          let errorMessage = "Failed to process request with AI service";
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              // Extract the core message from Together AI
              const aiError = errorData.error.message;
              if (
                aiError.includes("tokens") &&
                aiError.includes("must be <=")
              ) {
                errorMessage =
                  "Your note content is too large for AI processing. Please try with fewer notes or shorter content.";
              } else {
                errorMessage = aiError;
              }
            }
          } catch {
            // If parsing fails, use the raw error text
            errorMessage = errorText.substring(0, 200);
          }

          throw new AIProcessingError(errorMessage);
        }

        const data: TogetherAIResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
          throw new Error("No response from Together AI");
        }

        return data.choices[0].message.content as string;
      } catch (error) {
        // If this is the last attempt or non-retryable error, throw
        if (
          attempt === maxRetries ||
          (!(error instanceof Error && error.message.includes("503")) &&
            !(error instanceof Error && error.message.includes("429")))
        ) {
          console.error("Together AI API error:", error);
          const errorMessage =
            error instanceof Error && error.message.includes("503")
              ? "The AI service is temporarily unavailable. Please try again in a few minutes."
              : "Failed to process request with AI service. Please try again.";
          throw new AIProcessingError(errorMessage, error);
        }

        // Otherwise, retry with backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Request failed. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but just in case
    throw new AIProcessingError(
      "Failed to process request with Together AI after all retries",
    );
  }

  /**
   * Truncate content to fit within token limits
   * Rough estimate: 1 token ≈ 4 characters
   * Max tokens for input should be around 28000 to leave room for max_new_tokens
   */
  private truncateContent(content: string, maxTokens: number = 28000): string {
    const maxChars = maxTokens * 4; // Rough estimate: 4 chars per token
    if (content.length <= maxChars) {
      return content;
    }

    const truncated = content.substring(0, maxChars);
    const lastParagraph = truncated.lastIndexOf("\n\n");
    const lastSentence = truncated.lastIndexOf(". ");

    // Try to truncate at paragraph or sentence boundary
    if (lastParagraph > maxChars * 0.8) {
      return (
        truncated.substring(0, lastParagraph) +
        "\n\n[Content truncated due to length...]"
      );
    } else if (lastSentence > maxChars * 0.8) {
      return (
        truncated.substring(0, lastSentence + 1) +
        " [Content truncated due to length...]"
      );
    }

    return truncated + " [Content truncated due to length...]";
  }

  /**
   * Parse JSON response from AI, handling markdown code blocks
   */
  private parseJSONResponse(content: string): unknown {
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent
          .replace(/^```json\s*/, "")
          .replace(/```\s*$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent
          .replace(/^```\s*/, "")
          .replace(/```\s*$/, "");
      }

      // Remove trailing commas from JSON (common AI mistake)
      // This regex finds commas followed by whitespace and a closing brace/bracket
      cleanContent = cleanContent.replace(/,(\s*[}\]])/g, "$1").trim();

      // Check if response looks like an error message rather than JSON
      if (!cleanContent.startsWith("{") && !cleanContent.startsWith("[")) {
        console.error("AI returned non-JSON response:", content);
        throw new AIProcessingError(
          "Insufficient content to generate the requested tool. Please ensure your note has enough detailed content.",
        );
      }

      // Sanitize control characters within JSON string values
      // This fixes unescaped newlines, tabs, etc. that the AI might include
      cleanContent = this.sanitizeJSONString(cleanContent);

      return JSON.parse(cleanContent);
    } catch (error) {
      if (error instanceof AIProcessingError) {
        throw error;
      }
      // Log more details about the parsing failure
      console.error("Failed to parse JSON response:");
      console.error("Original content length:", content.length);
      console.error("Content preview:", content.substring(0, 500));
      console.error("Parse error:", error);
      
      throw new AIProcessingError(
        "Failed to parse AI response as JSON. The AI may have returned malformed data."
      );
    }
  }

  /**
   * Sanitize JSON string by escaping control characters within string values
   * AI models sometimes return unescaped newlines/tabs in JSON strings
   */
  private sanitizeJSONString(jsonStr: string): string {
    // Find all string values in the JSON and escape control characters
    // This regex matches: "key": "value" pairs
    return jsonStr.replace(
      /"([^"]+)"(\s*:\s*)"((?:[^"\\]|\\.)*)"/g,
      (match, key, colon, value) => {
        // Escape control characters in the value
        const sanitizedValue = value
          .replace(/\n/g, "\\n")   // Escape newlines
          .replace(/\r/g, "\\r")   // Escape carriage returns
          .replace(/\t/g, "\\t")   // Escape tabs
          .replace(/\f/g, "\\f")   // Escape form feeds
          .replace(/[\b]/g, "\\b"); // Escape backspaces (use [\b] not \b which matches word boundaries)
        
        return `"${key}"${colon}"${sanitizedValue}"`;
      }
    );
  }

  /**
   * Process raw note content into an organized, highlighted version
   */
  async processNote(rawContent: string): Promise<OrganizedNoteContent> {
    try {
      const systemPrompt = `You are an expert study assistant that helps students organize their notes. 
Your task is to analyze raw study notes and transform them into well-structured, organized content with clear sections, key points, and highlights.

Return your response as a JSON object with this exact structure:
{
  "title": "A descriptive title for the notes",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Main content for this section",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ],
  "highlights": ["Important concept 1", "Important concept 2"],
  "summary": "A concise summary of the entire content"
}`;

      const userPrompt = `Please organize and structure the following study notes:\n\n${rawContent}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 3000,
        temperature: 0.5,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as OrganizedNoteContent;
    } catch (error) {
      throw new AIProcessingError("Failed to process note content", error);
    }
  }

  /**
   * Generate quiz from large content by processing in chunks
   * This ensures all selected notes are included, even if content exceeds token limits
   */
  private async generateQuizInChunks(
    content: string,
    totalQuestions: number,
    difficulty: "easy" | "medium" | "hard"
  ): Promise<QuizContent> {
    const maxCharsPerChunk = 100000;
    
    // Split content into chunks at note boundaries (marked by \n\n---\n\n)
    const noteSeparator = "\n\n---\n\n";
    const notes = content.split(noteSeparator);
    
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const note of notes) {
      if ((currentChunk + note + noteSeparator).length > maxCharsPerChunk) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = note;
        } else {
          // Single note is too long, include it anyway but truncate
          chunks.push(this.truncateContent(note, 25000));
        }
      } else {
        currentChunk += (currentChunk ? noteSeparator : "") + note;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    console.log(`Processing ${chunks.length} chunks to generate questions from all ${notes.length} notes`);
    
    // Distribute questions across chunks proportionally
    const questionsPerChunk = Math.ceil(totalQuestions / chunks.length);
    
    // Generate questions for each chunk
    const allQuestions: QuizContent["questions"] = [];
    for (let i = 0; i < chunks.length; i++) {
      const questionsForThisChunk = Math.min(
        questionsPerChunk,
        totalQuestions - allQuestions.length
      );
      
      if (questionsForThisChunk <= 0) break;
      
      console.log(`Generating ${questionsForThisChunk} questions from chunk ${i + 1}/${chunks.length}...`);
      
      const systemPrompt = `You are an expert educator creating quiz questions from study material.
Generate ${questionsForThisChunk} multiple-choice questions at ${difficulty} difficulty level.

Return your response as a JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this is correct"
    }
  ]
}

Guidelines:
- Make questions clear and unambiguous
- Ensure all options are plausible
- Provide detailed explanations
- Cover different aspects of the content
- correctAnswer is the index (0-3) of the correct option`;

      const userPrompt = `Create ${questionsForThisChunk} ${difficulty} quiz questions from this content:\n\n${chunks[i]}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 3000,
        temperature: 0.7,
      });

      const parsed = this.parseJSONResponse(response) as QuizContent;
      
      // Renumber question IDs to be unique across all chunks
      const renumberedQuestions = parsed.questions.map((q, idx) => ({
        ...q,
        id: `q${allQuestions.length + idx + 1}`
      }));
      
      allQuestions.push(...renumberedQuestions);
    }
    
    console.log(`Generated ${allQuestions.length} total questions from ${chunks.length} chunks`);
    
    return {
      questions: allQuestions
    };
  }

  /**
   * Generate a quiz from content
   */
  async generateQuiz(
    content: string,
    options: {
      questionCount?: number;
      difficulty?: "easy" | "medium" | "hard";
    } = {},
  ): Promise<QuizContent> {
    try {
      // Validate content
      if (!content || content.trim().length < 50) {
        throw new AIProcessingError(
          "Note content is too short to generate a quiz. Please add more detailed content (at least 50 characters).",
        );
      }

      const { questionCount = 10, difficulty = "medium" } = options;

      // Check if content needs to be processed in chunks
      const maxCharsPerChunk = 100000; // ~25,000 tokens
      
      if (content.length > maxCharsPerChunk) {
        console.log(`Content is large (${content.length} chars), processing in chunks to include all notes...`);
        return await this.generateQuizInChunks(content, questionCount, difficulty);
      }

      // Truncate content if too large
      const truncatedContent = this.truncateContent(content, 26000);

      const systemPrompt = `You are an expert educator creating quiz questions from study material.
Generate ${questionCount} multiple-choice questions at ${difficulty} difficulty level.

Return your response as a JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this is correct"
    }
  ]
}

Guidelines:
- Make questions clear and unambiguous
- Ensure all options are plausible
- Provide detailed explanations
- Cover different aspects of the content
- correctAnswer is the index (0-3) of the correct option`;

      const userPrompt = `Create ${questionCount} ${difficulty} quiz questions from this content:\n\n${truncatedContent}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 3000,
        temperature: 0.7,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as QuizContent;
    } catch (error) {
      console.error("Quiz generation error:", error);
      if (error instanceof AIProcessingError) {
        throw error;
      }
      // Preserve the original error message
      const message =
        error instanceof Error ? error.message : "Failed to generate quiz";
      throw new AIProcessingError(message, error);
    }
  }

  /**
   * Generate flashcards from large content by processing in chunks
   * This ensures all selected notes are included, even if content exceeds token limits
   */
  private async generateFlashcardsInChunks(
    content: string,
    totalCards: number
  ): Promise<FlashcardContent> {
    const maxCharsPerChunk = 100000;
    
    // Split content into chunks at note boundaries (marked by \n\n---\n\n)
    const noteSeparator = "\n\n---\n\n";
    const notes = content.split(noteSeparator);
    
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const note of notes) {
      if ((currentChunk + note + noteSeparator).length > maxCharsPerChunk) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = note;
        } else {
          // Single note is too long, include it anyway but truncate
          chunks.push(this.truncateContent(note, 25000));
        }
      } else {
        currentChunk += (currentChunk ? noteSeparator : "") + note;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    console.log(`Processing ${chunks.length} chunks to generate flashcards from all ${notes.length} notes`);
    
    // Distribute cards across chunks proportionally
    const cardsPerChunk = Math.ceil(totalCards / chunks.length);
    
    // Generate flashcards for each chunk
    const allCards: FlashcardContent["cards"] = [];
    for (let i = 0; i < chunks.length; i++) {
      const cardsForThisChunk = Math.min(
        cardsPerChunk,
        totalCards - allCards.length
      );
      
      if (cardsForThisChunk <= 0) break;
      
      console.log(`Generating ${cardsForThisChunk} flashcards from chunk ${i + 1}/${chunks.length}...`);
      
      const systemPrompt = `You are an expert educator creating flashcards for effective studying.
Generate ${cardsForThisChunk} flashcards that help students memorize key concepts.

Return your response as a JSON object with this exact structure:
{
  "cards": [
    {
      "id": "card1",
      "front": "Question or concept on front of card",
      "back": "Answer or explanation on back of card"
    }
  ]
}

Guidelines:
- Front should be a clear question or prompt
- Back should be a concise but complete answer
- Cover the most important concepts
- Make cards atomic (one concept per card)
- Use varied question types`;

      const userPrompt = `Create ${cardsForThisChunk} flashcards from this content:\n\n${chunks[i]}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 2500,
        temperature: 0.6,
      });

      const parsed = this.parseJSONResponse(response) as FlashcardContent;
      
      // Renumber card IDs to be unique across all chunks
      const renumberedCards = parsed.cards.map((card, idx) => ({
        ...card,
        id: `card${allCards.length + idx + 1}`
      }));
      
      allCards.push(...renumberedCards);
    }
    
    console.log(`Generated ${allCards.length} total flashcards from ${chunks.length} chunks`);
    
    return {
      cards: allCards
    };
  }

  /**
   * Generate flashcards from content
   */
  async generateFlashcards(
    content: string,
    options: {
      cardCount?: number;
    } = {},
  ): Promise<FlashcardContent> {
    try {
      // Validate content
      if (!content || content.trim().length < 50) {
        throw new AIProcessingError(
          "Note content is too short to generate flashcards. Please add more detailed content (at least 50 characters).",
        );
      }

      const { cardCount = 15 } = options;

      // Check if content needs to be processed in chunks
      const maxCharsPerChunk = 100000; // ~25,000 tokens
      
      if (content.length > maxCharsPerChunk) {
        console.log(`Content is large (${content.length} chars), processing in chunks to include all notes...`);
        return await this.generateFlashcardsInChunks(content, cardCount);
      }

      // Truncate content if too large
      const truncatedContent = this.truncateContent(content, 26000);

      const systemPrompt = `You are an expert educator creating flashcards for effective studying.
Generate ${cardCount} flashcards that help students memorize key concepts.

Return your response as a JSON object with this exact structure:
{
  "cards": [
    {
      "id": "card1",
      "front": "Question or concept on front of card",
      "back": "Answer or explanation on back of card"
    }
  ]
}

Guidelines:
- Front should be a clear question or prompt
- Back should be a concise but complete answer
- Cover the most important concepts
- Make cards atomic (one concept per card)
- Use varied question types`;

      const userPrompt = `Create ${cardCount} flashcards from this content:\n\n${truncatedContent}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 2500,
        temperature: 0.6,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as FlashcardContent;
    } catch (error) {
      console.error("Flashcard generation error:", error);
      if (error instanceof AIProcessingError) {
        throw error;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate flashcards";
      throw new AIProcessingError(message, error);
    }
  }

  /**
   * Generate summary from large content by processing in chunks
   * This ensures all selected notes are included, even if content exceeds token limits
   */
  private async generateSummaryInChunks(
    content: string,
    summaryLength: "short" | "medium" | "detailed",
    summaryType: "paragraph" | "bullet" | "keypoints",
    config: { chars: number; bullets: number; keypoints: number }
  ): Promise<SummaryContent> {
    const maxCharsPerChunk = 100000;
    
    // Split content into chunks at note boundaries (marked by \n\n---\n\n)
    const noteSeparator = "\n\n---\n\n";
    const notes = content.split(noteSeparator);
    
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const note of notes) {
      if ((currentChunk + note + noteSeparator).length > maxCharsPerChunk) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = note;
        } else {
          // Single note is too long, include it anyway but truncate
          chunks.push(this.truncateContent(note, 25000));
        }
      } else {
        currentChunk += (currentChunk ? noteSeparator : "") + note;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    console.log(`Processing ${chunks.length} chunks to include all ${notes.length} notes`);
    
    // Generate summary for each chunk
    const chunkSummaries: SummaryContent[] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
      
      // Build format instructions based on summaryType
      let formatInstructions = "";
      let summaryFormat = "";

      if (summaryType === "paragraph") {
        formatInstructions =
          "Present the summary as a cohesive, flowing paragraph that reads naturally.";
        summaryFormat = "Write the summary as flowing prose in paragraph form.";
      } else if (summaryType === "bullet") {
        formatInstructions = `Present the summary as ${config.bullets} organized bullet points. Each bullet point should be a clear, concise statement covering a distinct aspect of the content.`;
        summaryFormat = `Format the summary as ${config.bullets} bullet points. Start each point with a bullet character (•) followed by the text. Example:
• First key point about the topic
• Second important concept
• Third major idea`;
      } else {
        formatInstructions = `Present the summary as ${config.keypoints} numbered key points focusing only on the most critical concepts. Each key point MUST start with a number and a period, and be separated by a newline.`;
        summaryFormat = `Format the summary as ${config.keypoints} numbered key points. Start each point with a number followed by a period and space, and put each key point on its own line. Example:
1. First critical concept
2. Second essential idea
3. Third main point`;
      }

      const systemPrompt = `You are an expert at creating concise, informative summaries of study material.
Create a ${summaryLength} summary in ${summaryType} format for this section of notes (part ${i + 1} of ${chunks.length}).

${formatInstructions}

Return your response as a JSON object with this exact structure:
{
  "summary": "Your formatted summary here",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "mainTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

CRITICAL FORMATTING REQUIREMENTS for the "summary" field:
${summaryFormat}

Guidelines:
- Summary field must follow the exact format specified above
- Include 3-5 items in keyPoints array
- Identify 2-4 items in mainTopics array
- Focus on the most important information from this section`;

      const userPrompt = `Create a summary of this content:\n\n${chunks[i]}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 1500,
        temperature: 0.5,
      });

      const parsed = this.parseJSONResponse(response);
      chunkSummaries.push(parsed as SummaryContent);
    }
    
    // Combine all chunk summaries into a final summary
    console.log(`Combining ${chunkSummaries.length} chunk summaries...`);
    
    const combinedSummaryText = chunkSummaries
      .map((s, i) => {
        if (summaryType === "paragraph") {
          return `**Part ${i + 1}:** ${s.summary}`;
        } else {
          return `**Part ${i + 1}:**\n${s.summary}`;
        }
      })
      .join("\n\n");
    
    const allKeyPoints = chunkSummaries.flatMap(s => s.keyPoints);
    const allMainTopics = [...new Set(chunkSummaries.flatMap(s => s.mainTopics))];
    
    return {
      summary: combinedSummaryText,
      keyPoints: allKeyPoints,
      mainTopics: allMainTopics
    };
  }

  /**
   * Generate a summary from content
   */
  async generateSummary(
    content: string,
    options: {
      summaryLength?: "short" | "medium" | "detailed";
      summaryType?: "paragraph" | "bullet" | "keypoints";
    } = {},
  ): Promise<SummaryContent> {
    try {
      // Validate content
      if (!content || content.trim().length < 50) {
        throw new AIProcessingError(
          "Note content is too short to generate a summary. Please add more detailed content (at least 50 characters).",
        );
      }

      const { summaryLength = "medium", summaryType = "paragraph" } = options;

      // Map summaryLength to character count and bullet count
      const lengthConfig = {
        short: { chars: 300, bullets: 3, keypoints: 3 },
        medium: { chars: 600, bullets: 6, keypoints: 5 },
        detailed: { chars: 1200, bullets: 10, keypoints: 8 },
      };
      const config = lengthConfig[summaryLength];

      // Check if content needs to be processed in chunks
      const maxCharsPerChunk = 100000; // ~25,000 tokens, leaving room for prompt and response
      
      if (content.length > maxCharsPerChunk) {
        console.log(`Content is large (${content.length} chars), processing in chunks to include all notes...`);
        return await this.generateSummaryInChunks(content, summaryLength, summaryType, config);
      }

      // Process normally for smaller content
      const truncatedContent = this.truncateContent(content, 27000);

      // Build format instructions based on summaryType
      let formatInstructions = "";
      let summaryFormat = "";

      if (summaryType === "paragraph") {
        formatInstructions =
          "Present the summary as a cohesive, flowing paragraph that reads naturally.";
        summaryFormat = "Write the summary as flowing prose in paragraph form.";
      } else if (summaryType === "bullet") {
        formatInstructions = `Present the summary as exactly ${config.bullets} organized bullet points. Each bullet point should be a clear, concise statement covering a distinct aspect of the content.`;
        summaryFormat = `Format the summary as exactly ${config.bullets} bullet points. Start each point with a bullet character (•) followed by the text. Example:
• First key point about the topic
• Second important concept
• Third major idea`;
      } else {
        formatInstructions = `Present the summary as exactly ${config.keypoints} numbered key points focusing only on the most critical concepts.`;
        formatInstructions = `Present the summary as exactly ${config.keypoints} numbered key points focusing only on the most critical concepts. Each key point MUST start with a number and a period, and be separated by a newline. Do NOT put all key points inline; each must be on its own line.`;
        summaryFormat = `Format the summary as exactly ${config.keypoints} numbered key points. Start each point with a number followed by a period and space, and put each key point on its own line. Example:
      1. First critical concept
      2. Second essential idea
      3. Third main point`;
      }

      const systemPrompt = `You are an expert at creating concise, informative summaries of study material.
Create a ${summaryLength} summary in ${summaryType} format.

${formatInstructions}

Return your response as a JSON object with this exact structure:
{
  "summary": "Your formatted summary here",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "mainTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

CRITICAL FORMATTING REQUIREMENTS for the "summary" field:
${summaryFormat}

${summaryType === "bullet" ? `MUST include exactly ${config.bullets} bullet points separated by newlines.` : ""}
${summaryType === "keypoints" ? `MUST include exactly ${config.keypoints} numbered points separated by newlines.` : ""}

Guidelines:
- Summary field must follow the exact format specified above
- Include 5-7 items in keyPoints array
- Identify 3-5 items in mainTopics array
- Focus on the most important information
- For bullet/keypoints format: Each point should be substantial but concise (1-2 sentences)`;

      const userPrompt = `Create a summary of this content:\n\n${truncatedContent}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 1500,
        temperature: 0.5,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as SummaryContent;
    } catch (error) {
      console.error("Summary generation error:", error);
      if (error instanceof AIProcessingError) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "Failed to generate summary";
      throw new AIProcessingError(message, error);
    }
  }

  /**
   * Generate learning tool based on type
   */
  async generateLearningTool(
    type: LearningToolType,
    content: string,
    options?: {
      questionCount?: number;
      difficulty?: "easy" | "medium" | "hard";
      cardCount?: number;
      summaryLength?: "short" | "medium" | "detailed";
      summaryType?: "paragraph" | "bullet" | "keypoints";
    },
  ): Promise<string> {
    try {
      let result: unknown;

      switch (type) {
        case "ORGANIZED_NOTE":
          result = await this.processNote(content);
          break;
        case "QUIZ":
          result = await this.generateQuiz(content, {
            questionCount: options?.questionCount,
            difficulty: options?.difficulty,
          });
          break;
        case "FLASHCARDS":
          result = await this.generateFlashcards(content, {
            cardCount: options?.cardCount,
          });
          break;
        case "SUMMARY":
          result = await this.generateSummary(content, {
            summaryLength: options?.summaryLength,
            summaryType: options?.summaryType,
          });
          break;
        default:
          throw new AIProcessingError(
            `Unsupported learning tool type: ${type}`,
          );
      }

      return JSON.stringify(result);
    } catch (error) {
      // Always re-throw AIProcessingError to preserve the message
      if (error instanceof AIProcessingError) {
        throw error;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate learning tool";
      throw new AIProcessingError(message, error);
    }
  }

  /**
   * Process pre-extracted text from PDF
   * Note: Text extraction happens client-side using pdfjs-dist.
   * This method just validates and returns the extracted text.
   * @param extractedText - Text already extracted from PDF client-side
   * @returns Validated text content
   */
  async extractTextFromPDF(extractedText: string): Promise<string> {
    // Text is already extracted by pdfjs client-side
    // Just validate and return it
    const trimmedText = extractedText.trim();

    if (!trimmedText || trimmedText.length === 0) {
      throw new AIProcessingError(
        "Extracted text is empty. The PDF might not contain readable text.",
      );
    }

    return trimmedText;
  }

  /**
   * Process PDF and convert to structured note
   * @param pdfBase64 - Base64 encoded PDF file
   * @returns Organized note content
   */
  async processPDFToNote(pdfBase64: string): Promise<OrganizedNoteContent> {
    try {
      // First, extract text from PDF
      const extractedText = await this.extractTextFromPDF(pdfBase64);

      // Then process the extracted text into organized notes
      return await this.processNote(extractedText);
    } catch (error) {
      throw new AIProcessingError("Failed to process PDF to note", error);
    }
  }

  /**
   * Extract text from image using vision model
   * @param imageBase64 - Base64 encoded image file
   * @returns Extracted text content
   */
  async extractTextFromImage(imageBase64: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert at extracting text from images.
Extract all text content from the provided image, maintaining the structure and formatting.
If there are diagrams, tables, or other visual elements, describe them clearly.
Return only the extracted text and descriptions, without any additional commentary.`;

      const messages: TogetherAIMessage[] = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text and describe visual elements from this image:",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ];

      const response = await this.makeRequest(
        messages,
        {
          maxTokens: 4000,
          temperature: 0.1,
        },
        this.visionModel,
      );

      return response;
    } catch (error) {
      throw new AIProcessingError("Failed to extract text from image", error);
    }
  }

  /**
   * Generate a well-structured, learning-optimized note from raw knowledge base
   * This transforms raw PDF/image content into a better formatted note for learning
   * @param knowledgeBase - Raw extracted content from PDF/image
   * @returns Well-structured note content
   */
  async generateStructuredNoteFromKnowledge(
    knowledgeBase: string,
  ): Promise<string> {
    try {
      const systemPrompt = `You are an expert educational content writer and learning specialist.
Your task is to transform raw extracted content (from PDFs or images) into well-structured, 
engaging study notes optimized for learning and retention.

Guidelines:
- Create clear sections with descriptive headings
- Break down complex information into digestible chunks
- Add bullet points for key concepts
- Include examples and explanations where helpful
- Highlight important terms and definitions
- Organize information logically (introduction → main concepts → details → summary)
- Use markdown formatting for better readability
- Make it student-friendly and easy to understand
- Preserve all important information from the source

Return a well-formatted markdown text that students can easily learn from.`;

      const userPrompt = `Transform this raw extracted content into a well-structured, learning-optimized study note:\n\n${knowledgeBase}`;

      const messages: TogetherAIMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 4000,
        temperature: 0.6,
      });

      return response;
    } catch (error) {
      throw new AIProcessingError(
        "Failed to generate structured note from knowledge",
        error,
      );
    }
  }

  /**
   * Process PDF with complete workflow: validate extracted text → store as knowledge → generate structured note
   * @param extractedText - Text already extracted from PDF client-side using pdfjs
   * @returns Object with knowledgeBase and structuredNote
   */
  async processPDFWithKnowledge(extractedText: string): Promise<{
    knowledgeBase: string;
    structuredNote: string;
  }> {
    if (!this.apiKey) {
      throw new AIProcessingError(
        "Together AI API key is not configured. Please set TOGETHER_API_KEY environment variable.",
      );
    }

    try {
      // Step 1: Validate the pre-extracted text (this becomes the knowledge base)
      const knowledgeBase = await this.extractTextFromPDF(extractedText);

      if (!knowledgeBase || knowledgeBase.trim().length === 0) {
        throw new AIProcessingError(
          "No content could be extracted from the PDF. The PDF might be empty or image-based.",
        );
      }

      // Step 2: Enforce hard limits to prevent excessive token usage and costs
      // Model limit: 32,769 tokens total, using 4,000 for output = 28,769 for input
      // At 4 chars/token = ~115,000 chars max per request
      const maxCharsPerChunk = 90000; // Conservative limit per chunk
      const maxTotalChars = 300000; // HARD LIMIT: Max 300k chars = ~3 chunks = ~3 AI credits
      const absoluteMaxChunks = 5; // Never process more than 5 chunks

      let processedText = knowledgeBase;
      let wasTruncated = false;

      // COST PROTECTION: Truncate if too large
      if (knowledgeBase.length > maxTotalChars) {
        console.warn(
          `⚠️ PDF is very large (${knowledgeBase.length} chars). Truncating to ${maxTotalChars} chars to prevent excessive costs.`,
        );
        processedText = knowledgeBase.substring(0, maxTotalChars);
        wasTruncated = true;
      }

      let structuredNote: string;

      if (processedText.length > maxCharsPerChunk) {
        // Split into chunks and process separately
        console.log(
          `PDF is large (${processedText.length} chars), processing in chunks...`,
        );

        const chunks: string[] = [];
        let currentChunk = "";
        const lines = processedText.split("\n");

        for (const line of lines) {
          // COST PROTECTION: Stop if we hit chunk limit
          if (chunks.length >= absoluteMaxChunks) {
            console.warn(
              `⚠️ Reached maximum chunk limit (${absoluteMaxChunks}). Stopping to prevent excessive costs.`,
            );
            break;
          }

          if ((currentChunk + line + "\n").length > maxCharsPerChunk) {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = line + "\n";
            } else {
              // Single line is too long, split it
              chunks.push(line.substring(0, maxCharsPerChunk));
              currentChunk = line.substring(maxCharsPerChunk) + "\n";
            }
          } else {
            currentChunk += line + "\n";
          }
        }
        if (currentChunk && chunks.length < absoluteMaxChunks) {
          chunks.push(currentChunk);
        }

        console.log(
          `Split into ${chunks.length} chunks (max ${absoluteMaxChunks})`,
        );

        // Process each chunk
        const processedChunks: string[] = [];
        for (let i = 0; i < chunks.length; i++) {
          console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
          const chunkNote = await this.generateStructuredNoteFromKnowledge(
            chunks[i],
          );
          processedChunks.push(`\n\n## Section ${i + 1}\n\n${chunkNote}`);
        }

        // Combine all chunks with appropriate warnings
        let headerNote = `*This note was created from a large PDF and processed in ${chunks.length} sections.*`;
        if (wasTruncated) {
          headerNote += `\n\n⚠️ **Note:** The PDF was very large and was truncated to ${maxTotalChars.toLocaleString()} characters to manage processing costs. Some content from the end of the document may not be included.`;
        }
        const markdownNote = `# Combined Note\n\n${headerNote}\n\n${processedChunks.join("\n\n---\n")}`;
        // Convert to HTML for TipTap editor
        structuredNote = markdownToHtml(markdownNote);
      } else {
        // Small enough to process in one go
        console.log(
          "Processing PDF in single request (under chunk size limit)",
        );
        const markdownNote =
          await this.generateStructuredNoteFromKnowledge(processedText);

        let finalMarkdown = markdownNote;
        if (wasTruncated) {
          finalMarkdown =
            `⚠️ **Note:** This PDF was truncated to manage processing costs. Original size: ${knowledgeBase.length.toLocaleString()} characters, processed: ${processedText.length.toLocaleString()} characters.\n\n---\n\n` +
            markdownNote;
        }

        // Convert to HTML for TipTap editor
        structuredNote = markdownToHtml(finalMarkdown);
      }

      return {
        knowledgeBase,
        structuredNote,
      };
    } catch (error) {
      if (error instanceof AIProcessingError) {
        throw error;
      }
      throw new AIProcessingError(
        "Failed to process PDF with knowledge extraction",
        error,
      );
    }
  }

  /**
   * Process image with complete workflow: extract → store as knowledge → generate structured note
   * @param imageBase64 - Base64 encoded image file
   * @returns Object with knowledgeBase and structuredNote
   */
  async processImageWithKnowledge(imageBase64: string): Promise<{
    knowledgeBase: string;
    structuredNote: string;
  }> {
    if (!this.apiKey) {
      throw new AIProcessingError(
        "Together AI API key is not configured. Please set TOGETHER_API_KEY environment variable.",
      );
    }

    try {
      // Step 1: Extract raw content from image (this is the knowledge base)
      const knowledgeBase = await this.extractTextFromImage(imageBase64);

      if (!knowledgeBase || knowledgeBase.trim().length === 0) {
        throw new AIProcessingError(
          "No content could be extracted from the image. The image might be empty or unclear.",
        );
      }

      // Step 2: Generate a well-structured note for better learning
      const structuredNote =
        await this.generateStructuredNoteFromKnowledge(knowledgeBase);

      return {
        knowledgeBase,
        structuredNote,
      };
    } catch (error) {
      if (error instanceof AIProcessingError) {
        throw error;
      }
      throw new AIProcessingError(
        "Failed to process image with knowledge extraction",
        error,
      );
    }
  }
}

export const aiService = new AIService();
