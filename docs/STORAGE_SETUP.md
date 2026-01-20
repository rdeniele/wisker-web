# Supabase Storage Setup Instructions

## Quick Start

Since creating storage buckets via API requires service role key, the easiest way is to create the bucket through the Supabase Dashboard.

### Step 1: Go to Supabase Dashboard

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `rescbglihrrqpveiomtn`
3. Click on **Storage** in the left sidebar

### Step 2: Create Bucket

1. Click **"New bucket"** button
2. Fill in the details:
   - **Name**: `wisker-files`
   - **Public bucket**: ✅ **Check this** (allows file downloads)
   - **File size limit**: `10485760` (10MB in bytes)
   - **Allowed MIME types**: Leave empty or add:
     ```
     application/pdf
     image/jpeg
     image/png
     image/gif
     image/webp
     ```

3. Click **"Create bucket"**

### Step 3: Verify

You should see `wisker-files` in your buckets list. Click on it to browse uploaded files.

## Alternative: Using Service Role Key

If you have the service role key (⚠️ keep it secret!):

1. Add to `.env`:

   ```env
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. Run initialization script:
   ```bash
   npx tsx scripts/init-storage.ts
   ```

To get service role key:

1. Go to Supabase Dashboard → Project Settings → API
2. Copy **service_role** key (not the anon key!)

## Verify It Works

After creating the bucket, test file upload:

```bash
# Test with your API
curl -X POST https://your-app.com/api/notes/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "your-subject-id",
    "title": "Test Note",
    "pdfBase64": "..."
  }'
```

Check Supabase Dashboard → Storage → wisker-files to see the uploaded file!

## Bucket Configuration

- **Name**: `wisker-files`
- **Public**: ✅ Yes (allows downloads)
- **Max file size**: 10MB
- **Allowed types**: PDF, JPEG, PNG, GIF, WebP

Files are organized by user ID:

```
wisker-files/
  ├── user-uuid-1/
  │   ├── 1737310123456-file1.pdf
  │   └── 1737310234567-file2.pdf
  └── user-uuid-2/
      └── 1737310345678-file3.pdf
```

## Next Steps

Once the bucket is created, your app will automatically:

- ✅ Upload PDFs/images when creating notes
- ✅ Extract text using AI vision model
- ✅ Store both file URL and extracted text
- ✅ Allow users to download original files
- ✅ Clean up files when notes are deleted

All done! 🎉
