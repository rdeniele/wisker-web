-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "file_type" TEXT,
ADD COLUMN     "file_url" TEXT;
