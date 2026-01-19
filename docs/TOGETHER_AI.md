# Together AI Integration Guide

## Overview

Wisker now uses **Together AI** for all AI-powered features including:
- Note organization and processing
- Quiz generation
- Flashcard creation
- Summary generation

## Setup Instructions

### 1. Get Your Together AI API Key

1. Visit [together.ai](https://together.ai)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key or copy your existing one

### 2. Configure Environment Variables

Add your Together AI API key to your `.env` file:

```env
# Together AI Configuration
TOGETHER_API_KEY="your_api_key_here"

# Optional: Specify a different model (default: meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo)
TOGETHER_AI_MODEL="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
```

**Important:** Never commit your `.env` file to version control!

### 3. Available Models

Together AI supports many open-source models. Here are recommended options:

#### Best for Quality (Recommended)
```env
TOGETHER_AI_MODEL="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
```

#### Fast and Cost-Effective
```env
TOGETHER_AI_MODEL="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
```

#### High Quality Alternative
```env
TOGETHER_AI_MODEL="mistralai/Mixtral-8x7B-Instruct-v0.1"
```

#### For Longer Content
```env
TOGETHER_AI_MODEL="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"
```

## How It Works

### AI Service Architecture

The `ai.service.ts` implements a clean interface for all AI operations:

```typescript
// Process notes
const organized = await aiService.processNote(rawContent);

// Generate quiz
const quiz = await aiService.generateQuiz(content, {
  questionCount: 10,
  difficulty: 'medium'
});

// Generate flashcards
const flashcards = await aiService.generateFlashcards(content, {
  cardCount: 15
});

// Generate summary
const summary = await aiService.generateSummary(content, {
  maxLength: 500,
  includeKeyPoints: true
});
```

### Request Flow

1. **User Request** → API endpoint
2. **Validation** → Check limits and permissions
3. **Content Fetch** → Get note(s) from database
4. **AI Processing** → Send to Together AI API
5. **Response Parsing** → Parse JSON response
6. **Storage** → Save to database
7. **Usage Tracking** → Increment AI usage count

### Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await aiService.generateQuiz(content);
} catch (error) {
  if (error instanceof AIProcessingError) {
    // AI service failed
    console.error('AI Error:', error.message);
  }
}
```

## API Endpoints Using AI

### 1. Process Note
```http
POST /api/notes/{noteId}/process
Authorization: Bearer {token}
```

**What it does:**
- Reads raw note content
- Organizes into sections with key points
- Extracts highlights
- Generates summary
- Stores as `aiProcessedContent`

### 2. Generate Learning Tool
```http
POST /api/learning-tools/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "QUIZ",
  "source": "SINGLE_NOTE",
  "noteId": "uuid"
}
```

**Types:**
- `ORGANIZED_NOTE`: Structured, highlighted content
- `QUIZ`: Multiple-choice questions with explanations
- `FLASHCARDS`: Front/back study cards
- `SUMMARY`: Concise overview with key points

## Response Formats

### Organized Note
```json
{
  "title": "Cell Biology Basics",
  "sections": [
    {
      "heading": "Cell Structure",
      "content": "Cells are the basic units of life...",
      "keyPoints": [
        "Cells have membrane, cytoplasm, and nucleus",
        "Prokaryotic vs eukaryotic cells",
        "Organelles perform specific functions"
      ]
    }
  ],
  "highlights": [
    "Mitochondria are the powerhouse of the cell",
    "DNA is stored in the nucleus"
  ],
  "summary": "Cells are fundamental units of life with distinct structures..."
}
```

### Quiz
```json
{
  "questions": [
    {
      "id": "q1",
      "question": "What organelle is known as the powerhouse of the cell?",
      "options": [
        "Mitochondria",
        "Nucleus",
        "Ribosome",
        "Endoplasmic Reticulum"
      ],
      "correctAnswer": 0,
      "explanation": "Mitochondria produce ATP through cellular respiration..."
    }
  ]
}
```

### Flashcards
```json
{
  "cards": [
    {
      "id": "card1",
      "front": "What is the function of mitochondria?",
      "back": "Mitochondria produce ATP through cellular respiration, providing energy for the cell."
    }
  ]
}
```

### Summary
```json
{
  "summary": "Cell biology covers the structure and function of cells...",
  "keyPoints": [
    "Cells are the basic unit of life",
    "Different types: prokaryotic and eukaryotic",
    "Organelles perform specialized functions"
  ],
  "mainTopics": [
    "Cell Structure",
    "Cell Types",
    "Organelle Functions"
  ]
}
```

## Configuration Options

### Temperature Settings

The service uses different temperatures for different tasks:

- **Note Processing**: 0.5 (more focused, consistent)
- **Quiz Generation**: 0.7 (balanced creativity)
- **Flashcards**: 0.6 (slightly creative)
- **Summaries**: 0.5 (focused, accurate)

### Token Limits

Default max tokens per request:
- Note Processing: 3000 tokens
- Quiz Generation: 3000 tokens
- Flashcards: 2500 tokens
- Summaries: 1500 tokens

### Adjusting Settings

To modify AI behavior, edit [service/ai.service.ts](../service/ai.service.ts):

```typescript
const response = await this.makeRequest(messages, {
  maxTokens: 3000,  // Increase for longer responses
  temperature: 0.7, // 0.0 = deterministic, 1.0 = creative
});
```

## Cost Management

### Together AI Pricing

Together AI charges based on:
- **Input tokens**: Content sent to the API
- **Output tokens**: Generated responses
- **Model used**: Larger models cost more

### Cost-Saving Tips

1. **Use smaller models for simple tasks**
   ```env
   TOGETHER_AI_MODEL="meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
   ```

2. **Implement caching** for frequently processed content

3. **Set appropriate token limits** to avoid over-generation

4. **Monitor usage** via Together AI dashboard

### Plan Limits

Wisker enforces plan-based AI usage limits:

- **FREE**: 100 AI operations/month
- **PRO**: 1,000 AI operations/month
- **PREMIUM**: 5,000 AI operations/month

Each operation (note processing, quiz generation, etc.) counts as 1 usage.

## Testing

### Test the AI Service

```bash
# 1. Create a test note
curl -X POST http://localhost:3000/api/notes/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "subject-uuid",
    "title": "Test Note",
    "rawContent": "Photosynthesis is the process by which plants convert sunlight into energy. Chlorophyll in chloroplasts captures light energy. The process produces glucose and oxygen."
  }'

# 2. Process the note with AI
curl -X POST http://localhost:3000/api/notes/{noteId}/process \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Generate a quiz
curl -X POST http://localhost:3000/api/learning-tools/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "QUIZ",
    "source": "SINGLE_NOTE",
    "noteId": "note-uuid"
  }'
```

### Expected Response Times

- Note Processing: 3-8 seconds
- Quiz Generation: 5-12 seconds
- Flashcards: 4-10 seconds
- Summary: 2-6 seconds

Times vary based on:
- Content length
- Model selected
- Together AI server load

## Troubleshooting

### "Together AI API key not configured"

**Solution:** Add `TOGETHER_API_KEY` to your `.env` file

### "Failed to process request with Together AI"

**Possible causes:**
1. Invalid API key
2. Rate limit exceeded
3. Model not available
4. Network issues

**Check:**
```bash
# Verify API key
echo $TOGETHER_API_KEY

# Test API directly
curl https://api.together.xyz/v1/models \
  -H "Authorization: Bearer $TOGETHER_API_KEY"
```

### "Failed to parse AI response as JSON"

**Cause:** AI returned invalid JSON

**Solution:** The service automatically handles markdown code blocks, but if issues persist:
1. Try a different model
2. Adjust temperature (lower = more consistent)
3. Check content length (may be truncated)

### Rate Limiting

Together AI has rate limits. If you hit them:
1. Implement exponential backoff
2. Use a rate limiting library
3. Upgrade your Together AI plan

## Best Practices

### 1. Content Preparation

- Clean input text (remove special characters)
- Keep content focused and relevant
- Split very long content into chunks

### 2. Error Handling

Always wrap AI calls in try-catch:

```typescript
try {
  const result = await aiService.generateQuiz(content);
  // Handle success
} catch (error) {
  if (error instanceof AIProcessingError) {
    // Handle AI-specific errors
  }
  // Handle other errors
}
```

### 3. User Feedback

Inform users:
- When AI is processing (show loading state)
- If limits are reached
- If processing fails (with retry option)

### 4. Monitoring

Track:
- AI processing success/failure rates
- Average response times
- Token usage
- Cost per operation

## Advanced Configuration

### Custom System Prompts

Modify prompts in [service/ai.service.ts](../service/ai.service.ts):

```typescript
const systemPrompt = `You are an expert study assistant...
[Customize instructions here]
Return JSON format: {...}`;
```

### Adding New AI Features

1. Define response type in [src/types/api.ts](../src/types/api.ts)
2. Add method to `AIService` class
3. Add to `generateLearningTool()` switch statement
4. Update database enum if needed

### Retry Logic

Add retry for transient failures:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Retries exhausted');
}

// Usage
const result = await withRetry(() => 
  aiService.generateQuiz(content)
);
```

## Production Checklist

- [ ] API key stored securely in environment variables
- [ ] Error handling implemented in all AI calls
- [ ] Loading states shown to users
- [ ] Usage limits enforced
- [ ] Monitoring and logging enabled
- [ ] Retry logic for transient failures
- [ ] Rate limiting implemented
- [ ] Cost alerts configured
- [ ] Fallback behavior defined

## Support

- **Together AI Docs**: https://docs.together.ai
- **API Reference**: https://docs.together.ai/reference
- **Model List**: https://docs.together.ai/docs/inference-models
- **Pricing**: https://www.together.ai/pricing

## Future Enhancements

Consider adding:
- **Caching**: Store and reuse AI responses
- **Batch Processing**: Process multiple notes at once
- **Streaming**: Real-time response streaming
- **Fine-tuning**: Custom models for better results
- **Analytics**: Track AI performance metrics
- **A/B Testing**: Compare different models/prompts
