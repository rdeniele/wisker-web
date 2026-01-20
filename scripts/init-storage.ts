import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const BUCKET_NAME = "wisker-files";

/**
 * Initialize Supabase Storage Bucket
 * This script ensures the wisker-files bucket exists
 * Run this once during setup
 */
async function initializeStorage() {
  try {
    console.log("Initializing Supabase Storage bucket...");

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials in .env file");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if bucket exists
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (bucketExists) {
      console.log("✓ Storage bucket already exists!");
    } else {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
        },
      );

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log("✓ Storage bucket created successfully!");
    }

    console.log("\nBucket Details:");
    console.log("  Name:", BUCKET_NAME);
    console.log("  Max file size: 10MB");
    console.log("  Allowed types: PDF, JPEG, PNG, GIF, WebP");
    console.log("  Public access: Yes");

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Failed to initialize storage bucket:");
    console.error(error);
    process.exit(1);
  }
}

initializeStorage();
