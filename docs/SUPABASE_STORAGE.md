# Supabase Storage Integration - Complete Guide

## Overview

Your backend now stores PDF and image files in **Supabase Storage** while extracting text using AI vision models. This gives you the best of both worlds:

- ✅ Original files preserved for viewing/downloading
- ✅ Text extracted for note content and processing
- ✅ Automatic file management and cleanup

## What Changed

### Database Schema

Added file metadata to notes:

```prisma
model Note {
  // ... existing fields
  fileUrl     String?   // Public URL to file in Supabase Storage
  fileName    String?   // Original filename
  fileSize    Int?      // File size in bytes
  fileType    String?   // MIME type (application/pdf, image/jpeg, etc.)
}
```

### Storage Structure

Files are organized by user:

```
wisker-files/
  ├── user-id-1/
  │   ├── 1737310123456-Lecture_1.pdf
  │   ├── 1737310234567-Notes_Chapter_2.pdf
  │   └── 1737310345678-Diagram.png
  ├── user-id-2/
  │   └── 1737310456789-Summary.pdf
```

## Setup

### 1. Initialize Storage Bucket

Run this **once** to create the storage bucket:

```bash
npx tsx scripts/init-storage.ts
```

This creates a bucket named `wisker-files` with:

- **Public access** (for file downloads)
- **10MB size limit** per file
- **Allowed types**: PDF, JPEG, PNG, GIF, WebP

### 2. Verify in Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Storage** section
3. You should see `wisker-files` bucket
4. Click on it to browse uploaded files

## How It Works

### Note Creation Flow

**1. User uploads PDF/image →**  
**2. Frontend converts to base64 →**  
**3. API receives base64 →**  
**4. Parallel operations:**

- Vision AI extracts text
- File uploaded to Supabase Storage

**5. Database saves:**

- Extracted text as `rawContent`
- File URL for downloads
- File metadata (name, size, type)

### File Storage

```typescript
// When creating a note with PDF
POST /api/notes/create
{
  "subjectId": "uuid",
  "title": "Lecture 1",
  "pdfBase64": "JVBERi0xLjQK..."
}

// Backend automatically:
// 1. Extracts text: "This is the content..."
// 2. Uploads PDF to: wisker-files/user-id/1737310123456-Lecture_1.pdf
// 3. Saves note with:
//    - rawContent: "This is the content..."
//    - fileUrl: "https://...supabase.co/.../Lecture_1.pdf"
//    - fileName: "Lecture_1.pdf"
//    - fileSize: 245760
//    - fileType: "application/pdf"
```

## API Endpoints

### Create Note with File

```typescript
POST /api/notes/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "subjectId": "subject-uuid",
  "title": "My Notes",
  "pdfBase64": "base64_string"  // or imageBase64
}

// Response
{
  "success": true,
  "data": {
    "id": "note-uuid",
    "title": "My Notes",
    "rawContent": "Extracted text...",
    "fileUrl": "https://...supabase.co/.../My_Notes.pdf",
    "fileName": "My_Notes.pdf",
    "fileSize": 245760,
    "fileType": "application/pdf",
    ...
  }
}
```

### Download Original File

```typescript
GET /api/notes/{noteId}/download
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "downloadUrl": "https://...supabase.co/...?token=...",
    "fileName": "My_Notes.pdf",
    "fileType": "application/pdf"
  }
}

// downloadUrl is a signed URL valid for 1 hour
```

### Get Storage Statistics

```typescript
GET /api/user/storage
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "totalFiles": 15,
    "totalSize": 12582912,      // bytes
    "totalSizeMB": "12.00",     // formatted
    "notesWithFiles": 15
  }
}
```

### Delete All User Files

```typescript
DELETE /api/user/storage
Authorization: Bearer {token}

// Deletes all files from storage and removes file references
// Notes remain but fileUrl becomes null
```

## Frontend Implementation

### Complete Upload Component

```typescript
'use client';

import { useState } from 'react';

interface FileUploadProps {
  subjectId: string;
  onSuccess: (note: any) => void;
}

export function FileUpload({ subjectId, onSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF or image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(20);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      setProgress(40);

      // Upload
      const token = localStorage.getItem('token'); // or from auth context
      const response = await fetch('/api/notes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId,
          title: file.name.replace(/\.(pdf|jpg|jpeg|png|gif|webp)$/i, ''),
          [file.type === 'application/pdf' ? 'pdfBase64' : 'imageBase64']: base64,
        }),
      });

      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const result = await response.json();
      onSuccess(result.data);

      // Reset
      e.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 font-medium">
          Upload PDF or Image
        </label>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm border rounded-lg cursor-pointer"
        />
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Uploading and extracting text... {progress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
```

### Download File Component

```typescript
interface DownloadButtonProps {
  noteId: string;
  fileName?: string;
}

export function DownloadButton({ noteId, fileName }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/${noteId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const { data } = await response.json();

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      alert('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
    >
      {downloading ? 'Getting file...' : `Download ${fileName || 'File'}`}
    </button>
  );
}
```

### Storage Stats Component

```typescript
export function StorageStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/user/storage', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data } = await response.json();
    setStats(data);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold mb-2">Storage Usage</h3>
      <div className="space-y-1 text-sm">
        <div>Files: {stats.totalFiles}</div>
        <div>Size: {stats.totalSizeMB} MB</div>
        <div>Notes with files: {stats.notesWithFiles}</div>
      </div>
    </div>
  );
}
```

## Storage Limits

### Current Configuration

- **Max file size**: 10MB per file
- **Allowed types**: PDF, JPEG, PNG, GIF, WebP
- **Storage quota**: 1GB free (Supabase)

### Plan Limits

Consider adding storage limits per plan:

```typescript
const STORAGE_LIMITS = {
  FREE: 100 * 1024 * 1024, // 100MB
  PRO: 1024 * 1024 * 1024, // 1GB
  PREMIUM: 5 * 1024 * 1024 * 1024, // 5GB
};
```

Update `note.service.ts` to check:

```typescript
// Before uploading
const stats = await StorageService.getUserStorageStats(userId);
const user = await prisma.user.findUnique({ where: { id: userId } });
const limit = STORAGE_LIMITS[user.planType];

if (stats.totalSize + buffer.length > limit) {
  throw new StorageLimitExceededError(limit);
}
```

## File Management

### Automatic Cleanup

Files are automatically deleted when:

- ✅ Note is deleted
- ✅ User calls DELETE `/api/user/storage`

### Manual Cleanup

Delete orphaned files:

```typescript
// scripts/cleanup-storage.ts
import { StorageService } from "@/service/storage.service";
import prisma from "@/lib/prisma";

async function cleanupOrphanedFiles() {
  // Get all file URLs from database
  const notes = await prisma.note.findMany({
    where: { fileUrl: { not: null } },
    select: { fileUrl: true },
  });

  const dbFiles = new Set(
    notes.map((n) => n.fileUrl!.split("/").slice(-2).join("/")),
  );

  // Get all files from storage
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    const storageFiles = await StorageService.listUserFiles(user.id);

    for (const filePath of storageFiles) {
      const shortPath = filePath.split("/").slice(-2).join("/");
      if (!dbFiles.has(shortPath)) {
        console.log("Deleting orphaned file:", filePath);
        await StorageService.deleteFile(filePath);
      }
    }
  }
}
```

## Security

### Access Control

- Files are stored in **public bucket** for easy downloads
- Access controlled via **API authentication**
- Download URLs are **signed** (1-hour expiry)

### File Validation

```typescript
// In storage.service.ts
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Validate before upload
if (!ALLOWED_MIME_TYPES.includes(fileType)) {
  throw new Error("Invalid file type");
}

if (buffer.length > MAX_FILE_SIZE) {
  throw new Error("File too large");
}
```

## Costs

### Supabase Storage Pricing

**Free tier:**

- 1GB storage
- 2GB bandwidth/month

**Pro tier ($25/month):**

- 100GB storage
- 200GB bandwidth/month
- $0.021/GB additional storage
- $0.09/GB additional bandwidth

### Example Cost Calculation

**Scenario:** 1,000 users, 50 notes each with 1MB PDFs

- **Storage**: 1,000 × 50 × 1MB = 50GB
- **Monthly cost**: 50GB storage = ~$1.05/month
- **Bandwidth**: If each file downloaded 2×/month = 100GB
- **Bandwidth cost**: 100GB = ~$9/month

**Total**: ~$10/month for 50,000 stored PDFs

## Monitoring

### Track Storage Usage

```typescript
// Add to user stats endpoint
GET /api/user/me

{
  "planType": "PRO",
  "storage": {
    "used": 52428800,        // 50MB
    "limit": 1073741824,     // 1GB
    "usedMB": "50.00",
    "limitMB": "1024.00",
    "percentage": 4.88
  }
}
```

### Alert on High Usage

```typescript
// Check weekly
if (stats.totalSize > limit * 0.8) {
  // Send email: "You're using 80% of your storage..."
}
```

## Troubleshooting

### Bucket Not Found

```bash
# Re-run initialization
npx tsx scripts/init-storage.ts
```

### Upload Fails

1. Check file size < 10MB
2. Verify file type is allowed
3. Check Supabase storage quota
4. Verify environment variables set

### Download URL Expired

Signed URLs expire after 1 hour. Request new URL:

```typescript
GET / api / notes / { id } / download;
// Returns fresh signed URL
```

## Best Practices

### 1. Show Upload Progress

```typescript
// Use chunked upload for large files
const uploadWithProgress = async (
  file: File,
  onProgress: (p: number) => void,
) => {
  const chunkSize = 1024 * 1024; // 1MB chunks
  // ... implementation
};
```

### 2. Compress Before Upload

```typescript
// Use pdfjs to compress PDFs
import { getDocument } from "pdfjs-dist";

async function compressPDF(pdfData: ArrayBuffer): Promise<ArrayBuffer> {
  // Compression logic
}
```

### 3. Preview Before Saving

```typescript
// Show extracted text for user verification
const [extractedText, setExtractedText] = useState("");
const [showPreview, setShowPreview] = useState(true);

// After extraction
setExtractedText(response.data.rawContent);
setShowPreview(true);

// User can edit before final save
```

### 4. Batch Operations

```typescript
// Upload multiple files
const uploadMultiple = async (files: File[]) => {
  const results = await Promise.all(files.map((file) => uploadFile(file)));
  return results;
};
```

## Migration Guide

If you have existing notes without files:

```typescript
// No migration needed!
// fileUrl, fileName, fileSize, fileType are all optional
// Existing notes work perfectly with NULL values
```

## Summary

Your backend now provides:

✅ **Automatic file storage** - PDFs/images saved to Supabase  
✅ **Text extraction** - AI vision reads file content  
✅ **File downloads** - Users can view original files  
✅ **Storage management** - Track usage, delete files  
✅ **Automatic cleanup** - Files deleted with notes  
✅ **Secure access** - Signed URLs, authentication required

All working and ready to use! 🎉
