# Supabase Vector Storage Setup Guide

## Option 1: Traditional pgvector Extension (Recommended)

### ✅ **Use this if:**
- Your project region doesn't have Vector Buckets yet
- You need a stable, production-ready solution
- You want full control over vector operations

### **Setup Steps:**

1. **Enable pgvector extension in Supabase SQL Editor:**

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

2. **Run Prisma migration:**

```bash
npx prisma migrate dev --name add_knowledge_base_system
```

3. **Create vector similarity search function:**

```sql
-- This is included in scripts/enable-pgvector.sql
CREATE OR REPLACE FUNCTION match_note_chunks(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_note_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  note_id uuid,
  chunk_index int,
  content text,
  heading text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    note_chunks.id,
    note_chunks.note_id,
    note_chunks.chunk_index,
    note_chunks.content,
    note_chunks.heading,
    1 - (note_chunks.embedding <=> query_embedding) as similarity
  FROM note_chunks
  WHERE 
    (filter_note_ids IS NULL OR note_chunks.note_id = ANY(filter_note_ids))
    AND note_chunks.embedding IS NOT NULL
    AND 1 - (note_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY note_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

4. **Create indexes for performance:**

```sql
-- Create IVFFlat index for faster similarity search
CREATE INDEX IF NOT EXISTS note_chunks_embedding_idx 
ON note_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For larger datasets, adjust lists parameter:
-- lists = rows / 1000 for IVFFlat
-- For 100k vectors, use lists = 100
```

### **Usage in Code:**

```typescript
// Already implemented in knowledgebase.service.ts
const chunks = await prisma.$queryRaw`
  SELECT * FROM match_note_chunks(
    ${embeddingStr}::vector,
    ${similarityThreshold},
    ${maxChunks},
    ${noteIds}::uuid[]
  )
`;
```

---

## Option 2: Supabase Vector Buckets (Beta)

### ⚠️ **Note:** Currently in private alpha, region-specific

### **Availability:**

Check if your project region supports Vector Buckets:
- Go to Supabase Dashboard → Storage → Vectors tab
- If you see "Coming soon to your project's region", use Option 1

### **When to Use:**

- Your region supports it
- You want managed vector storage
- You're comfortable with breaking changes during alpha

### **Setup Steps (when available):**

1. **Enable Vector Buckets in Supabase Dashboard:**
   - Navigate to Storage → Vectors
   - Create a new vector bucket
   - Configure dimensions (1024 for our embedding model)

2. **Update implementation to use Vector Buckets API:**

```typescript
// This would replace direct pgvector queries
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Store embedding
await supabase
  .from('vector-wisker-chunks')
  .insert({
    id: chunkId,
    embedding: embedding,
    metadata: { noteId, chunkIndex }
  });

// Search similar vectors
const { data } = await supabase
  .from('vector-wisker-chunks')
  .select('*')
  .match_vector('embedding', queryEmbedding)
  .limit(20);
```

---

## Current Recommendation

**Use Option 1 (pgvector extension)** for now because:

✅ Production-ready and stable  
✅ Full control over vector operations  
✅ Works in all regions  
✅ Already implemented in the codebase  
✅ Battle-tested by many applications  

**Consider Option 2** when:
- It becomes generally available in your region
- Supabase provides migration tooling
- The feature set meets your needs
- You want managed infrastructure

---

## Verification

### Test pgvector is working:

```sql
-- Test vector creation
SELECT '[1,2,3]'::vector;

-- Test similarity
SELECT 
  '[1,2,3]'::vector <=> '[3,2,1]'::vector AS cosine_distance,
  '[1,2,3]'::vector <-> '[3,2,1]'::vector AS l2_distance;

-- Check our table
SELECT COUNT(*) FROM note_chunks WHERE embedding IS NOT NULL;
```

### Test embedding service:

```typescript
import { embeddingService } from '@/service/embedding.service';

// Generate test embedding
const embedding = await embeddingService.generateEmbedding(
  'This is a test document about biology.'
);

console.log('Embedding dimension:', embedding.length);
console.log('First 5 values:', embedding.slice(0, 5));
```

---

## Performance Optimization

### Index Types:

**IVFFlat (Default):**
- Good for most use cases
- Fast queries, good recall
- `lists` parameter: typically `rows / 1000`

**HNSW (For large datasets):**
```sql
CREATE INDEX note_chunks_embedding_hnsw_idx 
ON note_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Query Optimization:

```sql
-- Use prepared statement for better performance
PREPARE search_chunks AS
SELECT * FROM match_note_chunks($1::vector, $2::float, $3::int, $4::uuid[]);

-- Execute
EXECUTE search_chunks('[...]'::vector, 0.7, 20, ARRAY['uuid1','uuid2']::uuid[]);
```

---

## Troubleshooting

### "pgvector extension not found"
→ Run `CREATE EXTENSION vector;` in SQL Editor

### "could not create index of type 'ivfflat'"
→ Ensure pgvector is enabled before creating tables

### "operator does not exist: vector <=> vector"
→ Restart your database connection after enabling extension

### "vector dimension mismatch"
→ Check `TOGETHER_AI_EMBEDDING_MODEL` matches dimension in schema

---

## Migration Path

If/when Vector Buckets become available:

1. Keep pgvector implementation as is (it works!)
2. Evaluate Vector Buckets features and pricing
3. Test Vector Buckets in staging environment
4. Gradual migration with dual-write strategy
5. Monitor performance and costs
6. Full cutover once validated

**Current status:** No action needed, pgvector is the right choice.
