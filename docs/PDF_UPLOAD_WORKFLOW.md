# PDF Upload Workflow Documentation

## Overview

This document explains the PDF/Image upload feature with AI-powered content extraction and note generation.

## Workflow Steps

### 1. User Uploads PDF/Image

- User selects a PDF or image file through the UploadPDF component
- Maximum file size: 10MB
- Supported formats: PDF, JPEG, PNG, GIF

### 2. File Storage to Supabase

- File is converted to base64 format
- Uploaded to Supabase Storage bucket `wisker-files`
- Stored with user-specific path: `userId/timestamp-filename`
- Returns public URL for file access

### 3. AI Vision Processing (Knowledge Extraction)

- **For PDFs:** `aiService.extractTextFromPDF()` uses Together AI's vision model
- **For Images:** `aiService.extractTextFromImage()` uses Together AI's vision model
- Vision model reads both text and image content from the document
- Extracts raw content maintaining structure and formatting
- **This raw extracted content is stored as `knowledgeBase`**

### 4. Knowledge Base Storage

- The raw extracted content from step 3 is stored in the `knowledgeBase` field
- This preserves the original content exactly as extracted from the PDF/image
- Used as the source of truth for learning tools generation
- Never modified or altered after extraction

### 5. AI Note Generation

- **Method:** `aiService.generateStructuredNoteFromKnowledge()`
- Takes the `knowledgeBase` content as input
- AI processes and transforms it into a well-structured study note
- Features:
  - Clear sections with descriptive headings
  - Bullet points for key concepts
  - Better organization and formatting
  - Student-friendly language
  - Markdown formatting for readability

### 6. Note Content Display

- The AI-generated structured note is stored in `rawContent` field
- This is what users see when viewing the note
- Optimized for learning and comprehension
- Better formatted than the raw extracted content

### 7. Learning Tools Generation

- When generating quizzes, flashcards, summaries, etc.
- **Uses `knowledgeBase` field as the source**
- Ensures learning tools are based on complete original content
- More accurate and comprehensive than using the formatted note

## Database Schema

```prisma
model Note {
  id                    String    @id @default(uuid())
  subjectId             String    @map("subject_id")
  title                 String
  rawContent            String    @map("raw_content") @db.Text          // AI-generated structured note (for display)
  knowledgeBase         String?   @map("knowledge_base") @db.Text       // Raw extracted content (for learning tools)
  aiProcessedContent    String?   @map("ai_processed_content") @db.Text
  fileUrl               String?   @map("file_url")
  fileName              String?   @map("file_name")
  fileSize              Int?      @map("file_size")
  fileType              String?   @map("file_type")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
}
```

## Key Components

### AI Service Methods

1. **`extractTextFromPDF(pdfBase64: string)`**
   - Extracts raw text from PDF using vision model
   - Returns: Plain text content

2. **`extractTextFromImage(imageBase64: string)`**
   - Extracts text and describes visual elements from images
   - Returns: Plain text content with descriptions

3. **`generateStructuredNoteFromKnowledge(knowledgeBase: string)`**
   - Transforms raw content into learning-optimized note
   - Returns: Well-formatted markdown text

4. **`processPDFWithKnowledge(pdfBase64: string)`**
   - Complete workflow for PDFs
   - Returns: `{ knowledgeBase, structuredNote }`

5. **`processImageWithKnowledge(imageBase64: string)`**
   - Complete workflow for images
   - Returns: `{ knowledgeBase, structuredNote }`

### Note Service

**`createNote(userId, data)`**

- Checks user limits (notes and AI usage)
- Processes PDF/image if provided:
  - Calls `processPDFWithKnowledge()` or `processImageWithKnowledge()`
  - Stores knowledge base separately
  - Uses structured note as display content
  - Uploads file to Supabase Storage
- Increments AI usage count by 2 (extraction + generation)
- Creates note with all data

## AI Usage Tracking

Each PDF/image upload consumes **2 AI credits**:

1. One for content extraction (vision model)
2. One for structured note generation (text model)

## Error Handling

- File size validation (max 10MB)
- File type validation (PDF, images only)
- AI usage limit checks before processing
- Note limit checks before creation
- Comprehensive error messages for users

## User Experience

### Upload Flow

1. Click "Add Note" button
2. Choose "Upload PDF/Image"
3. Select or drag-drop file
4. See progress indicators:
   - "Uploading file..."
   - "Extracting content with AI..."
   - "Creating structured note..."
5. Success notification
6. Note appears in list

### What Users See

- **In note list:** Title and metadata
- **When viewing note:** AI-generated structured note (optimized for learning)
- **When generating tools:** System uses original knowledge base

## Benefits

1. **Dual Storage Approach:**
   - Knowledge base: Complete, unmodified source material
   - Structured note: User-friendly, learning-optimized display

2. **Better Learning Experience:**
   - Notes are easier to read and understand
   - Better organization and formatting
   - Student-friendly language

3. **Accurate Learning Tools:**
   - Generated from complete original content
   - No information loss in formatting
   - More comprehensive coverage

4. **Vision AI Capabilities:**
   - Reads text from PDFs and images
   - Describes diagrams and visual elements
   - Handles various document formats

## Future Enhancements

- Support for multi-page PDFs (currently processes first page)
- OCR for scanned documents
- Support for Word documents (.doc, .docx)
- Batch upload functionality
- Re-generate structured note from knowledge base
- Edit knowledge base capability
