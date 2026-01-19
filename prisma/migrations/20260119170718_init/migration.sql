-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "LearningToolType" AS ENUM ('ORGANIZED_NOTE', 'QUIZ', 'FLASHCARDS', 'SUMMARY');

-- CreateEnum
CREATE TYPE "LearningToolSource" AS ENUM ('SUBJECT', 'SINGLE_NOTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plan_type" "PlanType" NOT NULL DEFAULT 'FREE',
    "notes_limit" INTEGER NOT NULL DEFAULT 50,
    "subjects_limit" INTEGER NOT NULL DEFAULT 10,
    "ai_usage_limit" INTEGER NOT NULL DEFAULT 100,
    "ai_usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "raw_content" TEXT NOT NULL,
    "ai_processed_content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_tools" (
    "id" TEXT NOT NULL,
    "type" "LearningToolType" NOT NULL,
    "source" "LearningToolSource" NOT NULL,
    "subject_id" TEXT,
    "note_id" TEXT,
    "generated_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_tool_notes" (
    "learning_tool_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,

    CONSTRAINT "learning_tool_notes_pkey" PRIMARY KEY ("learning_tool_id","note_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "subjects_user_id_idx" ON "subjects"("user_id");

-- CreateIndex
CREATE INDEX "notes_subject_id_idx" ON "notes"("subject_id");

-- CreateIndex
CREATE INDEX "learning_tools_subject_id_idx" ON "learning_tools"("subject_id");

-- CreateIndex
CREATE INDEX "learning_tools_note_id_idx" ON "learning_tools"("note_id");

-- CreateIndex
CREATE INDEX "learning_tool_notes_learning_tool_id_idx" ON "learning_tool_notes"("learning_tool_id");

-- CreateIndex
CREATE INDEX "learning_tool_notes_note_id_idx" ON "learning_tool_notes"("note_id");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_tools" ADD CONSTRAINT "learning_tools_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_tools" ADD CONSTRAINT "learning_tools_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_tool_notes" ADD CONSTRAINT "learning_tool_notes_learning_tool_id_fkey" FOREIGN KEY ("learning_tool_id") REFERENCES "learning_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_tool_notes" ADD CONSTRAINT "learning_tool_notes_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
