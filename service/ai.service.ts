import {
  OrganizedNoteContent,
  QuizContent,
  FlashcardContent,
  SummaryContent,
} from '@/types/api';
import { LearningToolType } from '@prisma/client';
import { AIProcessingError } from '@/lib/errors';

interface TogetherAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | TogetherAIMessageContent[];
}

interface TogetherAIMessageContent {
  type: 'text' | 'image_url';
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
export class AIService {
  private apiKey: string;
  private model: string;
  private visionModel: string;
  private baseURL = 'https://api.together.xyz/v1';

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || '';
    this.model = process.env.TOGETHER_AI_MODEL || 'Qwen/Qwen2.5-72B-Instruct-Turbo';
    this.visionModel = process.env.TOGETHER_AI_VISION_MODEL || 'Qwen/Qwen3-VL-8B-Instruct';

    if (!this.apiKey) {
      console.warn('TOGETHER_API_KEY not found in environment variables');
    }
  }

  /**
   * Make a request to Together AI API
   */
  private async makeRequest(
    messages: TogetherAIMessage[],
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {},
    modelOverride?: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new AIProcessingError('Together AI API key not configured');
    }

    const requestBody: TogetherAIRequest = {
      model: modelOverride || this.model,
      messages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ['<|eot_id|>', '<|eom_id|>'],
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Together AI API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: TogetherAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Together AI');
      }

      return data.choices[0].message.content as string;
    } catch (error) {
      console.error('Together AI API error:', error);
      throw new AIProcessingError(
        'Failed to process request with Together AI',
        error
      );
    }
  }

  /**
   * Parse JSON response from AI, handling markdown code blocks
   */
  private parseJSONResponse(content: string): any {
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Failed to parse JSON response:', content);
      throw new AIProcessingError('Failed to parse AI response as JSON');
    }
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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 3000,
        temperature: 0.5,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as OrganizedNoteContent;
    } catch (error) {
      throw new AIProcessingError('Failed to process note content', error);
    }
  }

  /**
   * Generate a quiz from content
   */
  async generateQuiz(
    content: string,
    options: {
      questionCount?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
    } = {}
  ): Promise<QuizContent> {
    try {
      const { questionCount = 10, difficulty = 'medium' } = options;

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

      const userPrompt = `Create ${questionCount} ${difficulty} quiz questions from this content:\n\n${content}`;

      const messages: TogetherAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 3000,
        temperature: 0.7,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as QuizContent;
    } catch (error) {
      throw new AIProcessingError('Failed to generate quiz', error);
    }
  }

  /**
   * Generate flashcards from content
   */
  async generateFlashcards(
    content: string,
    options: {
      cardCount?: number;
    } = {}
  ): Promise<FlashcardContent> {
    try {
      const { cardCount = 15 } = options;

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

      const userPrompt = `Create ${cardCount} flashcards from this content:\n\n${content}`;

      const messages: TogetherAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 2500,
        temperature: 0.6,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as FlashcardContent;
    } catch (error) {
      throw new AIProcessingError('Failed to generate flashcards', error);
    }
  }

  /**
   * Generate a summary from content
   */
  async generateSummary(
    content: string,
    options: {
      maxLength?: number;
      includeKeyPoints?: boolean;
    } = {}
  ): Promise<SummaryContent> {
    try {
      const { maxLength = 500, includeKeyPoints = true } = options;

      const systemPrompt = `You are an expert at creating concise, informative summaries of study material.
Create a summary that captures the essential information in approximately ${maxLength} characters.

Return your response as a JSON object with this exact structure:
{
  "summary": "A comprehensive summary of the content",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "mainTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

Guidelines:
- Summary should be clear and well-written
- Include 5-7 key points
- Identify 3-5 main topics
- Focus on the most important information`;

      const userPrompt = `Create a summary of this content:\n\n${content}`;

      const messages: TogetherAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 1500,
        temperature: 0.5,
      });

      const parsed = this.parseJSONResponse(response);
      return parsed as SummaryContent;
    } catch (error) {
      throw new AIProcessingError('Failed to generate summary', error);
    }
  }

  /**
   * Generate learning tool based on type
   */
  async generateLearningTool(
    type: LearningToolType,
    content: string
  ): Promise<string> {
    try {
      let result: any;

      switch (type) {
        case 'ORGANIZED_NOTE':
          result = await this.processNote(content);
          break;
        case 'QUIZ':
          result = await this.generateQuiz(content);
          break;
        case 'FLASHCARDS':
          result = await this.generateFlashcards(content);
          break;
        case 'SUMMARY':
          result = await this.generateSummary(content);
          break;
        default:
          throw new AIProcessingError(`Unsupported learning tool type: ${type}`);
      }

      return JSON.stringify(result);
    } catch (error) {
      if (error instanceof AIProcessingError) {
        throw error;
      }
      throw new AIProcessingError('Failed to generate learning tool', error);
    }
  }

  /**
   * Extract text from PDF using vision model
   * @param pdfBase64 - Base64 encoded PDF file
   * @returns Extracted text content
   */
  async extractTextFromPDF(pdfBase64: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert at extracting text from PDF documents.
Extract all text content from the provided PDF image, maintaining the structure and formatting.
Return only the extracted text, without any additional commentary.`;

      const messages: TogetherAIMessage[] = [
        { 
          role: 'system', 
          content: systemPrompt 
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this PDF page:',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`,
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
        this.visionModel
      );

      return response;
    } catch (error) {
      throw new AIProcessingError('Failed to extract text from PDF', error);
    }
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
      throw new AIProcessingError('Failed to process PDF to note', error);
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
          role: 'system', 
          content: systemPrompt 
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text and describe visual elements from this image:',
            },
            {
              type: 'image_url',
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
        this.visionModel
      );

      return response;
    } catch (error) {
      throw new AIProcessingError('Failed to extract text from image', error);
    }
  }
}

export const aiService = new AIService();
