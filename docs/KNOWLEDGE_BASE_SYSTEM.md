# Knowledge Base System Implementation Guide

## 🚀 Overview

This guide explains the new AI-powered knowledge base system that converts uploaded files into reusable, searchable study materials.

## 📋 System Architecture

### **Three AI Models Working in Harmony:**

1. **Qwen3-VL-8B-Instruct** (Together AI) - Vision + Text extraction from files
2. **BAAI/bge-large-en-v1.5** (Together AI) - Text embeddings for semantic search  
3. **Kimi K2.5** (Together AI) - Content generation for notes, flashcards, quizzes

### **Data Flow:**

```
Upload File → Vision Extraction → Semantic Chunking → Generate Embeddings 
    ↓
[Knowledge Base Created]
    ↓
Reusable for: Notes, Flashcards, Quizzes, Summaries (instant generation!)
```

## 🛠️ Setup Instructions

### **1. Enable pgvector Extension in Supabase**

⚠️ **Note about Vector Buckets:** Supabase is rolling out a new "Vector Buckets" feature in private alpha, but it's region-specific. For production use, stick with the traditional pgvector extension which is stable and works everywhere.

Run this in your Supabase SQL Editor:

```bash
# In Supabase Dashboard: SQL Editor → New Query
```

```sql
-- Paste contents of scripts/enable-pgvector.sql
-- Or run manually:
CREATE EXTENSION IF NOT EXISTS vector;
```

See [SUPABASE_VECTOR_SETUP.md](./SUPABASE_VECTOR_SETUP.md) for detailed vector storage options.

### **2. Run Prisma Migration**

```bash
# Generate migration
npm run prisma migrate dev --name add_knowledge_base_system

# Or apply directly
npm run prisma db push
```

### **3. Set Environment Variables**
l models use Together AI - single API key!
TOGETHER_API_KEY=your_together_api_key
TOGETHER_AI_VISION_MODEL=Qwen/Qwen3-VL-8B-Instruct
TOGETHER_AI_KIMI_MODEL=moonshotai/Kimi-K2.5
TOGETHER_AI_EMBEDDING_MODEL=BAAI/bge-large-en-v1.5
```

#### **Getting API Keys:**

- **Together AI:** You already have this! One API key for all three models
  - Vision extraction (Qwen3-VL)
  - Embeddings (BAAI/bge-large)  
  - Content generation (Kimi K2.5)
  - Fallback generation (Llama 3.1-70B
#### **Getting API Keys:**

- **HuggingFace:** https://huggingface.co/settings/tokens (Free tier available)
- **Together AI:** Already configured (supports Qwen3-VL, Kimi K2.5, and Llama)

### **4. Install Dependencies** (if needed)

```bash
npm install
```

## 📊 Database Schema Changes

### **New Tables:**

1. **`note_chunks`** - Stores semantic chunks with embeddings (pgvector)
2. **`knowledge_bases`** - Metadata about processed notes  
3. **`ai_operation_logs`** - Tracks all AI operations for analytics

### **Updated Tables:**

- **`notes`** - Added `processing_status`, `processing_error` fields
- **`notes`** - Added relations to `note_chunks` and `knowledge_bases`

### **New Enum:**

```prisma
enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

## 🔄 Migration for Existing Notes

For notes already in your database, you can batch-process them:

```typescript
// Create a migration script: scripts/migrate-existing-notes.ts

import { prisma } from '@/lib/prisma';
import { knowledgeBaseService } from '@/service/knowledgebase.service';

async function migrateExistingNotes() {
  const notes = await prisma.note.findMany({
    where: {
      processingStatus: 'PENDING',
      rawContent: { not: null }
    }
  });

  console.log(`Found ${notes.length} notes to process`);

  for (const note of notes) {
    try {
      console.log(`Processing note ${note.id}...`);
      await knowledgeBaseService.createKnowledgeBase({
        noteId: note.id,
        rawContent: note.rawContent
      });
      console.log(`✓ Completed note ${note.id}`);
    } catch (error) {
      console.error(`✗ Failed note ${note.id}:`, error);
    }
  }

  console.log('Migration complete!');
}

migrateExistingNotes();
```

Run it:

```bash
npx tsx scripts/migrate-existing-notes.ts
```

## 📝 API Usage

### **Process a Note with Knowledge Base**

```typescript
POST /api/notes/[id]/process-kb

// Response
{
  "knowledgeBaseId": "uuid",
  "totalChunks": 25,
  "totalTokens": 15000
}
```

### **Generate Learning Tools (New Method)**

```typescript
POST /api/learning-tools/generate-kb

{
  "source": "SUBJECT | SINGLE_NOTE",
  "type": "QUIZ | FLASHCARDS | SUMMARY | ORGANIZED_NOTE",
  "subjectId": "uuid",  // For SUBJECT source
  "noteId": "uuid",     // For SINGLE_NOTE source
  "noteIds": ["uuid1", "uuid2"],  // Optional: specific notes
  
  // Tool-specific options
  "questionCount": 10,
  "difficulty": "easy | medium | hard",
  "cardCount": 15,
  "summaryType": "brief | comprehensive | bullet"
}
```

### **Check Knowledge Base Status**

```typescript
GET /api/notes/[id]/knowledge-base

// Response
{
  "exists": true,
  "totalChunks": 25,
  "totalTokens": 15000,
  "extractedConcepts": ["biology", "cell", "mitosis"],
  "processingStatus": "COMPLETED"
}
```

## 🎯 Service Layer Usage

### **1. Process Note with Knowledge Base**

```typescript
import { noteService } from '@/service/note.service';

// In your API route
const note = await noteService.processNoteWithKnowledgeBase(noteId, userId);
```

### **2. Generate Learning Tool with KB**

```typescript
import { learningToolService } from '@/service/learningtool.service';

const tool = await learningToolService.generateLearningToolWithKB(userId, {
  source: 'SUBJECT',
  type: 'QUIZ',
  subjectId: 'uuid',
  questionCount: 15,
  difficulty: 'medium'
});
```

### **3. Direct Knowledge Base Operations**

```typescript
import { knowledgeBaseService } from '@/service/knowledgebase.service';

// Create knowledge base
await knowledgeBaseService.createKnowledgeBase({
  noteId,
  rawContent: text
});

// Semantic search
const chunks = await knowledgeBaseService.semanticSearch({
  noteIds: ['uuid1', 'uuid2'],
  queryText: 'photosynthesis and cellular respiration',
  maxChunks: 20,
  similarityThreshold: 0.7
});

// Check readiness
const ready = await knowledgeBaseService.isKnowledgeBaseReady(noteId);
```

## 💡 Key Features

### **1. One-Time Processing**
- Extract content once using Qwen3-VL
- Generate embeddings once using E5-Large
- Reuse indefinitely for all learning tools

### **2. Semantic Search**
- Find relevant chunks based on query meaning
- Filter by similarity threshold
- Return only the most relevant content

### **3. Fallback Strategy**
- If Kimi is not configured → uses Together AI (Llama 3.1)
- If vision extraction fails → uses raw text
- If semantic search fails → retrieves all chunks

### **4. Cost-Effective**
- Knowledge base creation: ~5 credits (one-time)
- Learning tool generation: ~3-5 credits (instant with KB)
- No re-processing when generating multiple tools

### **5. Monitoring & Analytics**
- `ai_operation_logs` tracks every operation
- Monitor usage, costs, and performance
- Debug failed operations

## 🔧 Testing

### **Test Vision Extraction**

```typescript
import { visionExtractionService } from '@/service/vision.service';

const result = await visionExtractionService.extractFromImage(
  'https://example.com/image.jpg'
);

console.log(result.textContent);
console.log(result.visualElements);
```

### **Test Embedding Generation**

```typescript
import { embeddingService } from '@/service/embedding.service';

const embedding = await embeddingService.generateEmbedding(
  'This is a test document about biology.'
);

console.log(embedding.length); // Should be 1024
```

### **Test Kimi Generation**

```typescript
import { kimiService } from '@/service/kimi.service';

const flashcards = await kimiService.generateFlashcards(
  'Biology content...', 
  { count: 10, difficulty: 'medium' }
);

console.log(flashcards);
```

## 📈 Performance Tips

### **1. Batch Processing**
- Process multiple notes in background jobs
- Use queue system (BullMQ recommended)

### **2. Caching**
- Cache frequently accessed chunks
- Use Redis for generated content

### **3. Pagination**
- Limit chunk retrieval to needed amount
- Use semantic search for targeted retrieval

### **4. Monitoring**
- Track processing times in `ai_operation_logs`
- Set up alerts for failed operations

## 🐛 Troubleshooting

### **"pgvector extension not found"**
→ Run `enable-pgvector.sql` in Supabase SQL Editor
TOGETHER_API_KEY not configured"**
→ Check your `.env` file has the correct API key

### **"Knowledge base not ready"**
→ Check note's `processing_status` field. May need to reprocess.

### **"Failed to generate embedding"**
→ Check Together AI API status and rate limits
→ Check HuggingFace API rate limits. Use exponential backoff.

### **Vision extraction too slow**
→ Consider pre-extracting text using OCR, then use vision for verification

## 📚 Additional Resources

- [Together AI Docs](https://docs.together.ai/)
- [Together AI Embeddings](https://docs.together.ai/docs/embeddings-overview)
- [Kimi K2.5 Model](https://docs.together.ai/docs/kimi-k25)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Setup Guide](./SUPABASE_VECTOR_SETUP.md)

## 🎉 What's Next?

1. **Background Processing**: Implement job queue for async processing
2. **Caching Layer**: Add Redis for faster retrieval
3. **Advanced Search**: Implement hybrid search (semantic + keyword)
4. **Knowledge Graphs**: Extract and visualize concept relationships
5. **Multi-language Support**: Leverage E5's multilingual capabilities

---

**Need Help?** Check the implementation files:
- `/service/knowledgebase.service.ts`
- `/service/vision.service.ts`
- `/service/embedding.service.ts`
- `/service/kimi.service.ts`
- `/service/chunking.service.ts`
