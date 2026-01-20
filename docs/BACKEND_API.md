# Wisker Backend API Documentation

## Architecture Overview

This backend follows **industry-standard practices** with:

- **Next.js App Router** for API routes
- **Prisma ORM** for type-safe database access
- **Supabase** for authentication
- **Service Layer Pattern** for business logic
- **Comprehensive error handling** with custom error classes
- **Input validation** using Zod schemas
- **Type safety** throughout the stack

## Project Structure

```
wisker-web/
├── prisma/
│   └── schema.prisma                 # Database schema
├── service/                          # Service layer (business logic)
│   ├── ai.service.ts                # AI processing service
│   ├── learningtool.service.ts      # Learning tools service
│   ├── note.service.ts              # Notes service
│   ├── subject.service.ts           # Subjects service
│   └── user.service.ts              # User management service
├── src/
│   ├── app/
│   │   └── api/                     # API routes
│   │       ├── subjects/            # Subject endpoints
│   │       ├── notes/               # Note endpoints
│   │       ├── learning-tools/      # Learning tool endpoints
│   │       └── user/                # User endpoints
│   ├── lib/
│   │   ├── api-response.ts          # Response formatters
│   │   ├── errors.ts                # Custom error classes
│   │   ├── prisma.ts                # Prisma client
│   │   ├── validation.ts            # Zod schemas
│   │   └── supabase/                # Supabase clients
│   └── types/
│       ├── api.ts                   # API type definitions
│       └── auth.ts                  # Auth type definitions
```

## Core Principles

### 1. Separation of Concerns

- **API Routes**: Handle HTTP requests/responses, authentication
- **Services**: Business logic, database operations
- **Validation**: Input validation with Zod
- **Error Handling**: Centralized error management

### 2. Type Safety

- TypeScript throughout
- Prisma-generated types
- Zod validation schemas
- Strict type checking

### 3. Security

- Supabase authentication
- User ownership verification
- Input validation
- SQL injection prevention (via Prisma)

### 4. Plan-Based Limits

- Subject limits per plan
- Note limits per plan
- AI usage limits per plan
- Automatic enforcement in services

## API Endpoints

### Authentication

All endpoints require authentication via Supabase. Include the session token in requests.

### User Management

#### Get Current User

```http
GET /api/user/me
```

Returns the authenticated user's profile.

#### Get Usage Statistics

```http
GET /api/user/usage
```

Returns current usage vs. limits for subjects, notes, and AI.

**Response:**

```json
{
  "success": true,
  "data": {
    "notesUsed": 15,
    "notesLimit": 50,
    "subjectsUsed": 3,
    "subjectsLimit": 10,
    "aiUsageCount": 25,
    "aiUsageLimit": 100
  }
}
```

#### Update User Plan

```http
PATCH /api/user/plan
Content-Type: application/json

{
  "planType": "PRO" | "PREMIUM" | "FREE"
}
```

### Subjects

#### List Subjects

```http
GET /api/subjects?page=1&pageSize=20&search=math&sortBy=createdAt&sortOrder=desc
```

**Query Parameters:**

- `page` (number, default: 1)
- `pageSize` (number, default: 20, max: 100)
- `search` (string, optional)
- `sortBy` (enum: 'createdAt' | 'updatedAt' | 'title')
- `sortOrder` (enum: 'asc' | 'desc')

**Response:**

```json
{
  "success": true,
  "data": {
    "subjects": [...],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

#### Create Subject

```http
POST /api/subjects/create
Content-Type: application/json

{
  "title": "Biology 101",
  "description": "Introduction to biology"
}
```

**Validation:**

- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters

**Limit Check:** Enforces `subjectsLimit` from user's plan

#### Get Subject

```http
GET /api/subjects/{id}
```

#### Update Subject

```http
PATCH /api/subjects/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Delete Subject

```http
DELETE /api/subjects/{id}
```

⚠️ **Cascade deletes all notes and learning tools**

#### Get Subject Statistics

```http
GET /api/subjects/{id}/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "notesCount": 15,
    "learningToolsCount": 8,
    "recentActivity": [...]
  }
}
```

### Notes

#### List Notes

```http
GET /api/notes?subjectId={id}&page=1&pageSize=20&search=keyword&sortBy=createdAt
```

**Query Parameters:**

- `subjectId` (UUID, optional): Filter by subject
- `page`, `pageSize`, `search`, `sortBy`, `sortOrder`: Same as subjects

#### Create Note

```http
POST /api/notes/create
Content-Type: application/json

{
  "subjectId": "uuid",
  "title": "Chapter 1 Notes",
  "rawContent": "Raw note content here..."
}
```

**Validation:**

- `subjectId`: Required, valid UUID
- `title`: Required, 1-200 characters
- `rawContent`: Required, max 100,000 characters

**Limit Check:** Enforces `notesLimit` from user's plan

#### Get Note

```http
GET /api/notes/{id}
```

**Response includes:**

- `rawContent`: Original user input
- `aiProcessedContent`: AI-organized version (if processed)

#### Update Note

```http
PATCH /api/notes/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "rawContent": "Updated content"
}
```

#### Delete Note

```http
DELETE /api/notes/{id}
```

#### Process Note with AI

```http
POST /api/notes/{id}/process
```

**What it does:**

- Reads `rawContent`
- Processes with AI to organize/highlight
- Stores result in `aiProcessedContent`
- Increments user's `aiUsageCount`

**Limit Check:** Enforces `aiUsageLimit` from user's plan

### Learning Tools

#### List Learning Tools

```http
GET /api/learning-tools?subjectId={id}&type=QUIZ&source=SUBJECT&page=1
```

**Query Parameters:**

- `subjectId` (UUID, optional)
- `noteId` (UUID, optional)
- `type` (enum: 'ORGANIZED_NOTE' | 'QUIZ' | 'FLASHCARDS' | 'SUMMARY')
- `source` (enum: 'SUBJECT' | 'SINGLE_NOTE')
- `page`, `pageSize`, `sortBy`, `sortOrder`

#### Generate Learning Tool

```http
POST /api/learning-tools/generate
Content-Type: application/json
```

**Subject-Level (All Notes):**

```json
{
  "type": "QUIZ",
  "source": "SUBJECT",
  "subjectId": "uuid"
}
```

**Subject-Level (Selected Notes):**

```json
{
  "type": "FLASHCARDS",
  "source": "SUBJECT",
  "subjectId": "uuid",
  "noteIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Single Note:**

```json
{
  "type": "SUMMARY",
  "source": "SINGLE_NOTE",
  "noteId": "uuid"
}
```

**What it does:**

1. Validates source (subject or note)
2. Checks AI usage limit
3. Fetches content from note(s)
4. Processes with AI based on type
5. Stores generated content
6. Creates junction records (for multi-note)
7. Increments `aiUsageCount`

**Limit Check:** Enforces `aiUsageLimit` from user's plan

#### Get Learning Tool

```http
GET /api/learning-tools/{id}
```

**Response includes:**

- `generatedContent`: JSON string with type-specific structure
- `notes`: Array of associated notes (for subject-level)

#### Delete Learning Tool

```http
DELETE /api/learning-tools/{id}
```

## Data Flow

### 1. User Onboarding

```
User Signs Up → Supabase Auth → Create User in DB → Set Plan Limits
```

### 2. Subject Creation

```
User → POST /api/subjects/create → Check Subject Limit → Create Subject → Return Subject
```

### 3. Note Creation

```
User → POST /api/notes/create → Verify Subject Ownership → Check Note Limit → Save Raw Content → Return Note
```

### 4. Note Processing

```
User → POST /api/notes/{id}/process → Check AI Limit → AI Processes Content → Save Organized Content → Increment AI Usage
```

### 5. Learning Tool Generation (Subject-Level)

```
User → Select Subject & Notes → POST /api/learning-tools/generate →
Verify Ownership → Check AI Limit → Fetch Note Contents →
AI Generates Tool → Save Tool → Create Junction Records → Increment AI Usage
```

### 6. Learning Tool Generation (Single Note)

```
User → Select Note → POST /api/learning-tools/generate →
Verify Ownership → Check AI Limit → Fetch Note Content →
AI Generates Tool → Save Tool → Increment AI Usage
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NOTES_LIMIT_EXCEEDED",
    "message": "Notes limit of 50 exceeded. Please upgrade your plan.",
    "details": { ... }
  }
}
```

### Error Codes

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `VALIDATION_ERROR`: Invalid input
- `NOT_FOUND`: Resource not found
- `LIMIT_EXCEEDED`: Generic limit error
- `SUBJECTS_LIMIT_EXCEEDED`: Subject creation blocked
- `NOTES_LIMIT_EXCEEDED`: Note creation blocked
- `AI_USAGE_LIMIT_EXCEEDED`: AI operations blocked
- `INTERNAL_ERROR`: Server error
- `DATABASE_ERROR`: Database operation failed
- `AI_PROCESSING_ERROR`: AI service error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests (limit exceeded)
- `500`: Internal Server Error

## Service Layer

### Subject Service

- `getUserSubjects()`: List with pagination
- `getSubjectById()`: Fetch with ownership check
- `createSubject()`: Create with limit enforcement
- `updateSubject()`: Update with ownership check
- `deleteSubject()`: Delete with cascade
- `getSubjectStats()`: Get statistics

### Note Service

- `getUserNotes()`: List with filtering
- `getNoteById()`: Fetch with ownership check
- `createNote()`: Create with limit enforcement
- `updateNote()`: Update with ownership check
- `deleteNote()`: Delete with cascade
- `processNote()`: **AI processing with Together AI**
- `getSubjectNotes()`: Notes for a subject

### Learning Tool Service

- `getUserLearningTools()`: List with filtering
- `getLearningToolById()`: Fetch with ownership check
- `generateLearningTool()`: **Generate with Together AI**
- `deleteLearningTool()`: Delete

### User Service

- `getUserById()`: Get user profile
- `getUserByEmail()`: Find by email
- `createUser()`: Create with default limits
- `updateUserPlan()`: Update plan and limits
- `getUserUsageStats()`: Current usage vs. limits
- `resetAIUsage()`: Reset monthly AI counter
- `deleteUser()`: Delete with cascade

### AI Service (Together AI Integration)

- `processNote()`: Organize and highlight notes
- `generateQuiz()`: Create quiz questions with AI
- `generateFlashcards()`: Create flashcards with AI
- `generateSummary()`: Create summary with AI
- `generateLearningTool()`: Unified AI interface

**Together AI Features:**

- Uses Meta-Llama 3.1 70B model by default
- Structured JSON responses
- Smart prompt engineering
- Automatic retry and error handling
- Token optimization

See [TOGETHER_AI.md](./TOGETHER_AI.md) for complete AI integration guide.

## Plan Limits

### FREE Plan

- Subjects: 10
- Notes: 50
- AI Usage: 100/month

### PRO Plan

- Subjects: 50
- Notes: 500
- AI Usage: 1000/month

### PREMIUM Plan

- Subjects: Unlimited (-1)
- Notes: Unlimited (-1)
- AI Usage: 5000/month

Limits are automatically set when creating/updating user plans in `user.service.ts`.

## Security Best Practices

1. **Authentication**: All routes verify Supabase session
2. **Authorization**: Services verify resource ownership
3. **Input Validation**: Zod schemas validate all inputs
4. **SQL Injection**: Prevented by Prisma ORM
5. **Rate Limiting**: Enforced via plan limits
6. **Error Messages**: Generic messages to prevent info leaks
7. **Cascade Deletes**: Proper cleanup on deletion

## Database Schema

See [schema.prisma](../prisma/schema.prisma) for the complete schema.

**Key relationships:**

- User → Subjects (one-to-many)
- Subject → Notes (one-to-many)
- Subject → LearningTools (one-to-many)
- Note → LearningTools (one-to-many)
- LearningTool ←→ Notes (many-to-many via LearningToolNote)

## Next Steps

### 1. Configure Together AI ✅

The AI service is ready to use! Just add your API key:

```env
TOGETHER_API_KEY="your_together_api_key_here"
```

See [TOGETHER_AI.md](./TOGETHER_AI.md) for complete setup guide.

### 2. Add Webhook for Plan Updates

Create webhook endpoint for payment processor:

```typescript
POST / api / webhooks / payment;
```

### 3. Implement AI Usage Reset

Create a scheduled job to reset `aiUsageCount` monthly:

```typescript
// Can use Vercel Cron Jobs or external scheduler
POST / api / cron / reset - ai - usage;
```

### 4. Add Analytics

Track usage patterns:

- Most used learning tools
- Average notes per subject
- AI usage trends

### 5. Implement Caching

Add Redis caching for:

- Frequently accessed subjects
- User profiles
- Usage statistics

### 6. Rate Limiting

Add request rate limiting (beyond plan limits):

```typescript
// Example with upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit";
```

### 7. Monitoring

Set up monitoring for:

- API response times
- Error rates
- AI service uptime
- Database performance

## Development

### Run Prisma Migrations

```bash
npx prisma migrate dev
```

### Generate Prisma Client

```bash
npx prisma generate
```

### View Database

```bash
npx prisma studio
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
TOGETHER_API_KEY="your_together_api_key_here"
TOGETHER_AI_MODEL="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"
```

## Testing Endpoints

### Example: Create Subject and Note

```bash
# 1. Create subject
curl -X POST http://localhost:3000/api/subjects/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Biology", "description": "Study notes"}'

# 2. Create note
curl -X POST http://localhost:3000/api/notes/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "SUBJECT_UUID",
    "title": "Cell Structure",
    "rawContent": "Notes about cells..."
  }'

# 3. Process note
curl -X POST http://localhost:3000/api/notes/NOTE_UUID/process \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Generate quiz
curl -X POST http://localhost:3000/api/learning-tools/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "QUIZ",
    "source": "SINGLE_NOTE",
    "noteId": "NOTE_UUID"
  }'
```

## License

MIT
