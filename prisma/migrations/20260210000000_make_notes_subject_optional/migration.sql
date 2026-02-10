-- Migration: Make subjectId nullable in notes table and add userId field
-- This allows notes to exist without a subject (inbox/untagged notes)

-- Add userId column to notes table
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- Update existing notes to set user_id from their subject's user_id
UPDATE "notes" 
SET "user_id" = "subjects"."user_id"
FROM "subjects"
WHERE "notes"."subject_id" = "subjects"."id"
AND "notes"."user_id" IS NULL;

-- Make the subject_id column nullable
ALTER TABLE "notes" ALTER COLUMN "subject_id" DROP NOT NULL;

-- Make user_id NOT NULL after populating it
ALTER TABLE "notes" ALTER COLUMN "user_id" SET NOT NULL;

-- Add foreign key constraint for user_id
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "notes"("user_id");

-- Update the existing subject_id index if needed
-- (It should already exist, but this ensures it's there)
CREATE INDEX IF NOT EXISTS "notes_subject_id_idx" ON "notes"("subject_id");
