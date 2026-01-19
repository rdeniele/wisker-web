import { createClient } from '@/lib/supabase/server';

/**
 * Storage Service
 * Handles file uploads and downloads to/from Supabase Storage
 */

const BUCKET_NAME = 'wisker-files';

export interface UploadFileResult {
  url: string;
  path: string;
  size: number;
}

export class StorageService {
  /**
   * Initialize the storage bucket if it doesn't exist
   */
  static async initializeBucket(): Promise<void> {
    const supabase = await createClient();
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      // Create bucket with public access for file downloads
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
      });
    }
  }

  /**
   * Upload a file to Supabase Storage
   * @param base64Data - Base64 encoded file data
   * @param fileName - Original file name
   * @param userId - User ID for folder organization
   * @param fileType - MIME type of the file
   */
  static async uploadFile(
    base64Data: string,
    fileName: string,
    userId: string,
    fileType: string
  ): Promise<UploadFileResult> {
    const supabase = await createClient();

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    const fileSize = buffer.length;

    // Generate unique file path: userId/timestamp-filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
      size: fileSize,
    };
  }

  /**
   * Delete a file from Supabase Storage
   * @param filePath - Path to the file in storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get download URL for a file
   * @param filePath - Path to the file in storage
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  static async getDownloadUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to get download URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  /**
   * List all files for a user
   * @param userId - User ID
   */
  static async listUserFiles(userId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data?.map((file) => `${userId}/${file.name}`) || [];
  }

  /**
   * Delete all files for a user
   * @param userId - User ID
   */
  static async deleteUserFiles(userId: string): Promise<void> {
    const supabase = await createClient();

    // List all files
    const files = await this.listUserFiles(userId);

    if (files.length > 0) {
      // Delete all files
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(files);

      if (error) {
        throw new Error(`Failed to delete user files: ${error.message}`);
      }
    }
  }

  /**
   * Get storage statistics for a user
   * @param userId - User ID
   */
  static async getUserStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
  }> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (error) {
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }

    const totalFiles = data?.length || 0;
    const totalSize = data?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;

    return { totalFiles, totalSize };
  }
}
