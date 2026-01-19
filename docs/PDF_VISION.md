# PDF & Vision Model Integration Guide

## Overview

Wisker now supports **automatic text extraction** from PDFs and images when creating notes using Together AI's vision model (Qwen3-VL-8B-Instruct).

## Features

✅ **PDF Text Extraction** - Upload PDF files and extract text automatically  
✅ **Image OCR** - Extract text from images (screenshots, photos of notes, etc.)  
✅ **Automatic Processing** - AI reads and structures the content  
✅ **Multiple Input Methods** - Text, PDF, or image  

## How It Works

### 1. Note Creation with PDF

When creating a note, you can now provide:
- **Text content** (traditional)
- **PDF file** (base64 encoded)
- **Image file** (base64 encoded)

The system will:
1. Extract text from PDF/image using vision model
2. Store extracted text as `rawContent`
3. Increment AI usage count (extraction counts as 1 usage)

### 2. Vision Model Configuration

**Model Used:** `Qwen/Qwen3-VL-8B-Instruct`

This model can:
- Read text from images
- Extract content from PDF pages
- Describe visual elements (diagrams, charts)
- Maintain document structure

## API Usage

### Create Note with PDF

```typescript
POST /api/notes/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "subjectId": "uuid",
  "title": "Lecture 1 Notes",
  "pdfBase64": "JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PC9UeXBl..."
}
```

### Create Note with Image

```typescript
POST /api/notes/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "subjectId": "uuid",
  "title": "Whiteboard Notes",
  "imageBase64": "/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

### Create Note with Text (Traditional)

```typescript
POST /api/notes/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "subjectId": "uuid",
  "title": "My Notes",
  "rawContent": "Text content here..."
}
```

## Frontend Implementation

### Convert File to Base64

```typescript
// Convert PDF/Image file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data:type/subtype;base64, prefix
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}
```

### Upload PDF

```typescript
async function uploadPDFNote(subjectId: string, file: File) {
  try {
    // Convert to base64
    const pdfBase64 = await fileToBase64(file);
    
    // Create note
    const response = await fetch('/api/notes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subjectId,
        title: file.name.replace('.pdf', ''),
        pdfBase64,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Note created:', result.data);
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### React Component Example

```typescript
import { useState } from 'react';

function PDFUpload({ subjectId }: { subjectId: string }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      alert('Please select a PDF or image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    setProgress(30);
    
    try {
      const base64 = await fileToBase64(file);
      setProgress(60);
      
      const response = await fetch('/api/notes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId,
          title: file.name.replace(/\.(pdf|jpg|jpeg|png)$/i, ''),
          [file.type === 'application/pdf' ? 'pdfBase64' : 'imageBase64']: base64,
        }),
      });
      
      setProgress(100);
      const result = await response.json();
      
      if (result.success) {
        alert('Note created successfully!');
      } else {
        alert(`Error: ${result.error?.message}`);
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && (
        <div>
          <div>Uploading... {progress}%</div>
          <progress value={progress} max={100} />
        </div>
      )}
    </div>
  );
}
```

## Supported File Types

### PDF
- `.pdf` files
- `application/pdf` MIME type
- Single or multi-page documents

### Images
- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.gif` - GIF images
- `.webp` - WebP images
- `image/*` MIME types

## Limitations

### File Size
- **Maximum**: 10MB recommended
- Larger files may cause timeout or performance issues

### Quality
- Higher resolution = better text extraction
- Handwritten notes may have lower accuracy
- Complex layouts may need manual verification

### AI Usage
Each PDF/image extraction counts as **1 AI operation** towards your plan limit:
- **FREE**: 100 operations/month
- **PRO**: 1,000 operations/month
- **PREMIUM**: 5,000 operations/month

## Best Practices

### 1. File Preparation
- **Use clear, high-resolution images**
- **Ensure good lighting** for photos
- **Avoid skewed or rotated images**
- **Use PDF for multi-page documents**

### 2. Error Handling
```typescript
try {
  const note = await createNoteWithPDF(pdf);
} catch (error) {
  if (error.code === 'AI_USAGE_LIMIT_EXCEEDED') {
    // Show upgrade prompt
    showUpgradeModal();
  } else if (error.code === 'NOTES_LIMIT_EXCEEDED') {
    // Show note limit message
    showLimitMessage();
  } else {
    // Generic error
    showError('Failed to process PDF');
  }
}
```

### 3. User Experience
- Show loading indicator during upload
- Display progress (upload → extraction → processing)
- Allow users to edit extracted text
- Provide preview before saving

### 4. Validation
```typescript
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  // Check file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }
  
  return { valid: true };
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "note-uuid",
    "subjectId": "subject-uuid",
    "title": "Lecture 1 Notes",
    "rawContent": "Extracted text from PDF...",
    "aiProcessedContent": null,
    "createdAt": "2026-01-20T...",
    "updatedAt": "2026-01-20T..."
  }
}
```

### Error Responses

**AI Limit Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "AI_USAGE_LIMIT_EXCEEDED",
    "message": "AI usage limit of 100 exceeded. Please upgrade your plan."
  }
}
```

**Invalid File:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one of rawContent, pdfBase64, or imageBase64 must be provided"
  }
}
```

## Advanced Features

### Batch PDF Processing

Process multiple PDFs:

```typescript
async function batchUploadPDFs(subjectId: string, files: File[]) {
  const results = [];
  
  for (const file of files) {
    try {
      const base64 = await fileToBase64(file);
      const response = await fetch('/api/notes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId,
          title: file.name.replace('.pdf', ''),
          pdfBase64: base64,
        }),
      });
      
      const result = await response.json();
      results.push({ file: file.name, success: result.success });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ file: file.name, success: false, error });
    }
  }
  
  return results;
}
```

### Extract and Process in One Step

Create a processed note from PDF:

```typescript
async function createProcessedNoteFromPDF(subjectId: string, pdfBase64: string, title: string) {
  // 1. Create note with PDF extraction
  const createResponse = await fetch('/api/notes/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ subjectId, title, pdfBase64 }),
  });
  
  const note = await createResponse.json();
  
  if (!note.success) {
    throw new Error(note.error.message);
  }
  
  // 2. Process the note with AI
  const processResponse = await fetch(`/api/notes/${note.data.id}/process`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  return await processResponse.json();
}
```

## Testing

### Test with Sample PDF

```typescript
// Create a simple test PDF in base64
const testPDF = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PC9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKMTAwIDcwMCBUZAooSGVsbG8gV29ybGQhKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY0IDAwMDAwIG4gCjAwMDAwMDAxMjEgMDAwMDAgbiAKMDAwMDAwMDIxNyAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzEwCiUlRU9G';

// Test API call
const response = await fetch('/api/notes/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    subjectId: 'test-subject-uuid',
    title: 'Test PDF Note',
    pdfBase64: testPDF,
  }),
});

console.log(await response.json());
```

## Troubleshooting

### "Failed to extract text from PDF"

**Causes:**
- Invalid base64 encoding
- Corrupted PDF file
- PDF too large
- Vision model error

**Solutions:**
- Verify base64 encoding is correct
- Try with a different PDF
- Reduce file size
- Check Together AI service status

### Extracted Text is Garbled

**Causes:**
- Low resolution image
- Complex PDF layout
- Handwritten text
- Non-standard fonts

**Solutions:**
- Use higher resolution images
- Manually verify and edit text
- Use typed/printed documents
- Process one page at a time

### Slow Processing

**Expected:** 5-15 seconds for PDF extraction

**If slower:**
- Large file size
- Complex document
- API rate limiting
- Network latency

**Optimize:**
- Compress PDFs before upload
- Process pages separately
- Use image format for simple pages

## Pricing Estimate

Based on Together AI pricing:

**Vision Model (Qwen3-VL-8B):** $0.18 input / $0.68 output per 1M tokens

**Typical costs per extraction:**
- Simple PDF page: ~$0.001 - $0.005
- Complex PDF page: ~$0.01 - $0.02
- Image with text: ~$0.002 - $0.01

**Monthly estimates:**
- 100 extractions: ~$0.50 - $2.00
- 1,000 extractions: ~$5.00 - $20.00

## Future Enhancements

Planned features:
- [ ] Multi-page PDF batch processing
- [ ] OCR confidence scores
- [ ] Manual text correction interface
- [ ] PDF page selection
- [ ] Image preprocessing (rotation, enhancement)
- [ ] Table extraction
- [ ] Diagram description
- [ ] Equation recognition

## Support

For issues or questions:
- Check [TOGETHER_AI.md](./TOGETHER_AI.md) for API setup
- Review [BACKEND_API.md](./BACKEND_API.md) for general API docs
- Contact Together AI support for model-specific issues
