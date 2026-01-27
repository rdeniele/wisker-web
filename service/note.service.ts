import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  NotesLimitExceededError,
  DatabaseError,
  ForbiddenError,
  AIUsageLimitExceededError,
} from "@/lib/errors";
import { CreateNoteRequest, UpdateNoteRequest, NoteDto } from "@/types/api";
import { subjectService } from "./subject.service";
import { aiService } from "./ai.service";
import { StorageService } from "./storage.service";

export class NoteService {
  /**
   * Get all notes for a user with optional filtering
   */
  async getUserNotes(
    userId: string,
    options: {
      subjectId?: string;
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: "createdAt" | "updatedAt" | "title";
      sortOrder?: "asc" | "desc";
    } = {},
  ) {
    try {
      const {
        subjectId,
        page = 1,
        pageSize = 20,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      const skip = (page - 1) * pageSize;

      const where = {
        subject: { userId },
        ...(subjectId && { subjectId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { rawContent: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          include: {
            subject: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
        prisma.note.count({ where }),
      ]);

      return {
        notes,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new DatabaseError("Failed to fetch notes", error);
    }
  }

  /**
   * Get a single note by ID
   */
  async getNoteById(noteId: string, userId: string): Promise<NoteDto> {
    try {
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: {
          subject: true,
        },
      });

      if (!note) {
        throw new NotFoundError("Note");
      }

      // Verify ownership through subject
      if (note.subject.userId !== userId) {
        throw new ForbiddenError("You do not have access to this note");
      }

      return {
        ...note,
        knowledgeBase: note.knowledgeBase ?? undefined,
        aiProcessedContent: note.aiProcessedContent ?? undefined,
        fileUrl: note.fileUrl ?? undefined,
        fileName: note.fileName ?? undefined,
        fileSize: note.fileSize ?? undefined,
        fileType: note.fileType ?? undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch note", error);
    }
  }

  /**
   * Create a new note
   */
  async createNote(userId: string, data: CreateNoteRequest): Promise<NoteDto> {
    try {
      // Verify subject ownership
      await subjectService.getSubjectById(data.subjectId, userId);

      // Check user's notes limit
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          notesLimit: true,
          subjects: {
            select: {
              _count: {
                select: { notes: true },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError("User");
      }

      // Calculate total notes across all subjects
      const totalNotes = user.subjects.reduce(
        (sum: number, subject: { _count: { notes: number } }) =>
          sum + subject._count.notes,
        0,
      );

      if (totalNotes >= user.notesLimit) {
        throw new NotesLimitExceededError(user.notesLimit);
      }

      let rawContent = data.rawContent || "";
      let knowledgeBase: string | undefined;
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;

      // If PDF or image is provided, extract text using AI and upload to storage
      // Process files if provided
      if (data.pdfText || data.pdfBase64 || data.imageBase64) {
        // COST PROTECTION: Enforce hard limits on PDF size
        const MAX_PDF_CHARS = 500000; // Absolute maximum: 500k chars
        const MAX_CHUNKS = 5; // Maximum 5 chunks = 5 AI credits per PDF

        if (data.pdfText && data.pdfText.length > MAX_PDF_CHARS) {
          throw new DatabaseError(
            `PDF is too large (${data.pdfText.length.toLocaleString()} characters). ` +
              `Maximum allowed: ${MAX_PDF_CHARS.toLocaleString()} characters. ` +
              `Please upload a smaller PDF or split it into multiple files.`,
          );
        }

        try {
          if (data.pdfText) {
            // Process PDF text: Use extracted text to generate structured note
            console.log("Processing PDF text with AI...");
            const { knowledgeBase: extractedKnowledge, structuredNote } =
              await aiService.processPDFWithKnowledge(data.pdfText);

            knowledgeBase = extractedKnowledge; // Store raw extracted text as knowledge
            rawContent = structuredNote; // Store AI-generated structured note as content

            // Calculate actual credits used (1 per chunk processed)
            // Rough estimate: each 100k chars = 1 chunk
            const actualCredits = Math.max(
              1,
              Math.ceil(data.pdfText.length / 100000),
            );

            console.log(`Actual credits used: ${actualCredits}`);
          } else if (data.pdfBase64) {
            // Legacy support: Handle base64 PDF (not used anymore but kept for compatibility)
            console.log("Processing PDF base64 with AI (legacy)...");
            rawContent = data.pdfBase64; // Store as-is

            // Upload PDF to storage
            console.log("Uploading PDF to storage...");
            const uploadResult = await StorageService.uploadFile(
              data.pdfBase64,
              `${data.title}.pdf`,
              userId,
              "application/pdf",
            );
            fileUrl = uploadResult.url;
            fileName = `${data.title}.pdf`;
            fileSize = uploadResult.size;
            fileType = "application/pdf";
          } else if (data.imageBase64) {
            // Process image: extract knowledge base and generate structured note
            console.log("Processing image with AI...");
            const { knowledgeBase: extractedKnowledge, structuredNote } =
              await aiService.processImageWithKnowledge(data.imageBase64);

            knowledgeBase = extractedKnowledge; // Store raw extracted content as knowledge
            rawContent = structuredNote; // Store AI-generated structured note as content

            // Determine image type from base64 header
            const imageType = data.imageBase64.startsWith("/9j/")
              ? "image/jpeg"
              : data.imageBase64.startsWith("iVBORw")
                ? "image/png"
                : data.imageBase64.startsWith("R0lGOD")
                  ? "image/gif"
                  : "image/jpeg";
            const extension = imageType.split("/")[1];

            // Upload image to storage
            console.log("Uploading image to storage...");
            const uploadResult = await StorageService.uploadFile(
              data.imageBase64,
              `${data.title}.${extension}`,
              userId,
              imageType,
            );
            fileUrl = uploadResult.url;
            fileName = `${data.title}.${extension}`;
            fileSize = uploadResult.size;
            fileType = imageType;

            console.log("Image extraction completed");
          }
        } catch (aiError) {
          console.error("AI processing error:", aiError);
          throw new DatabaseError(
            `Failed to process file with AI: ${aiError instanceof Error ? aiError.message : "Unknown error"}`,
            aiError instanceof Error ? aiError : undefined,
          );
        }
      }

      // Create note
      const note = await prisma.note.create({
        data: {
          subjectId: data.subjectId,
          title: data.title,
          rawContent,
          knowledgeBase,
          fileUrl,
          fileName,
          fileSize,
          fileType,
        },
        include: {
          subject: true,
        },
      });

      return {
        ...note,
        knowledgeBase: note.knowledgeBase ?? undefined,
        aiProcessedContent: note.aiProcessedContent ?? undefined,
        fileUrl: note.fileUrl ?? undefined,
        fileName: note.fileName ?? undefined,
        fileSize: note.fileSize ?? undefined,
        fileType: note.fileType ?? undefined,
      };
    } catch (error) {
      if (
        error instanceof NotesLimitExceededError ||
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof AIUsageLimitExceededError
      ) {
        throw error;
      }
      throw new DatabaseError("Failed to create note", error);
    }
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    userId: string,
    data: UpdateNoteRequest,
  ): Promise<NoteDto> {
    try {
      // Verify ownership
      await this.getNoteById(noteId, userId);

      // Update note
      const note = await prisma.note.update({
        where: { id: noteId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.rawContent && { rawContent: data.rawContent }),
        },
        include: {
          subject: true,
        },
      });

      return {
        ...note,
        knowledgeBase: note.knowledgeBase ?? undefined,
        aiProcessedContent: note.aiProcessedContent ?? undefined,
        fileUrl: note.fileUrl ?? undefined,
        fileName: note.fileName ?? undefined,
        fileSize: note.fileSize ?? undefined,
        fileType: note.fileType ?? undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to update note", error);
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, userId: string): Promise<void> {
    try {
      // Verify ownership and get note data
      const note = await this.getNoteById(noteId, userId);

      // Delete file from storage if it exists
      if (note.fileUrl) {
        try {
          // Extract storage path from URL
          const urlParts = note.fileUrl.split("/");
          const bucketIndex = urlParts.findIndex(
            (part) => part === "wisker-files",
          );
          if (bucketIndex !== -1) {
            const filePath = urlParts.slice(bucketIndex + 1).join("/");
            await StorageService.deleteFile(filePath);
          }
        } catch (storageError) {
          // Log but don't fail the deletion if storage cleanup fails
          console.error("Failed to delete file from storage:", storageError);
        }
      }

      // Delete note from database
      await prisma.note.delete({
        where: { id: noteId },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to delete note", error);
    }
  }

  /**
   * Process note with AI (organize and highlight)
   */
  async processNote(noteId: string, userId: string): Promise<NoteDto> {
    try {
      // Verify ownership
      const note = await this.getNoteById(noteId, userId);

      // Process with AI service
      const organizedContent = await aiService.processNote(note.rawContent);
      const aiProcessedContent = JSON.stringify(organizedContent);

      // Update note with AI processed content
      await prisma.note.update({
        where: { id: noteId },
        data: { aiProcessedContent },
      });

      // Fetch the updated note to return
      return await this.getNoteById(noteId, userId);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof AIUsageLimitExceededError
      ) {
        throw error;
      }
      throw new DatabaseError("Failed to process note", error);
    }
  }

  /**
   * Get notes for a subject
   */
  async getSubjectNotes(
    subjectId: string,
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
    } = {},
  ) {
    try {
      // Verify subject ownership
      await subjectService.getSubjectById(subjectId, userId);

      return this.getUserNotes(userId, { ...options, subjectId });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch subject notes", error);
    }
  }
}

export const noteService = new NoteService();
