import { prisma } from "@/lib/prisma";
import {
  NotFoundError,
  NotesLimitExceededError,
  DatabaseError,
  ForbiddenError,
  AIUsageLimitExceededError,
  AIProcessingError,
  AppError,
} from "@/lib/errors";
import { CreateNoteRequest, UpdateNoteRequest, NoteDto } from "@/types/api";
import { subjectService } from "./subject.service";
import { aiService } from "./ai.service";
import { StorageService } from "./storage.service";
import { knowledgeBaseService } from "./knowledgebase.service";
import { kimiService } from "./kimi.service";

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
      if (error instanceof DatabaseError) {
        throw error;
      }
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
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof DatabaseError
      ) {
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

      // Check if user has reached their notes limit (-1 means unlimited)
      if (user.notesLimit !== -1 && totalNotes >= user.notesLimit) {
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
      console.error("[NOTE_SERVICE] Processing file - pdfText:", !!data.pdfText, "pptBase64:", !!data.pptBase64, "length:", data.pdfText?.length);
      if (data.pdfText || data.pdfBase64 || data.imageBase64 || data.pptBase64) {
        // COST PROTECTION: Enforce hard limits on PDF size
        const MAX_PDF_CHARS = 1000000; // Absolute maximum: 1M chars (~10 chunks max)

        if (data.pdfText && data.pdfText.length > MAX_PDF_CHARS) {
          throw new AIProcessingError(
            `PDF is too large (${data.pdfText.length.toLocaleString()} characters). ` +
              `Maximum allowed: ${MAX_PDF_CHARS.toLocaleString()} characters. ` +
              `Please upload a smaller PDF or split it into multiple files.`,
          );
        }
        
        console.error("[NOTE_SERVICE] PDF size check passed:", data.pdfText?.length, "chars");

        try {
          if (data.pdfText) {
            // Process PDF text: Use extracted text to generate structured note
            console.error("[NOTE_SERVICE] Calling aiService.processPDFWithKnowledge");
            const { knowledgeBase: extractedKnowledge, structuredNote } =
              await aiService.processPDFWithKnowledge(data.pdfText);
            console.error("[NOTE_SERVICE] PDF processing complete - KB length:", extractedKnowledge.length, "Note length:", structuredNote.length);

            knowledgeBase = extractedKnowledge; // Store raw extracted text as knowledge
            rawContent = structuredNote; // Store AI-generated structured note as content

            // Calculate actual credits used (1 per chunk processed)
            // Rough estimate: each 100k chars = 1 chunk
            const actualCredits = Math.max(
              1,
              Math.ceil(data.pdfText.length / 100000),
            );

            // Credits calculated
          } else if (data.pdfBase64) {
            // Legacy support: Handle base64 PDF (not used anymore but kept for compatibility)
            rawContent = data.pdfBase64; // Store as-is

            // Upload PDF to storage
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

            // Image extraction completed
          } else if (data.pptBase64) {
            // Process PowerPoint: extract text and generate structured note
            console.error("[NOTE_SERVICE] Processing PowerPoint file");
            const officeparser = (await import("officeparser")).default;
            
            // Convert base64 to buffer
            const buffer = Buffer.from(data.pptBase64, "base64");
            
            // Extract text from PowerPoint
            const result: any = await new Promise((resolve, reject) => {
              officeparser.parseOffice(buffer, (ast: any, err: any) => {
                if (err) reject(err);
                else resolve(ast);
              });
            });
            
            // Convert AST to string (officeparser returns text content as string property)
            const extractedText = typeof result === 'string' ? result : JSON.stringify(result);
            
            console.error("[NOTE_SERVICE] PPT text extracted, length:", extractedText.length);
            
            if (!extractedText || extractedText.trim().length === 0) {
              throw new AIProcessingError(
                "No text could be extracted from PowerPoint file. It might be empty or contain only images.",
              );
            }

            // Process through AI similar to PDF
            const { knowledgeBase: extractedKnowledge, structuredNote } =
              await aiService.processPDFWithKnowledge(extractedText);
            
            knowledgeBase = extractedKnowledge;
            rawContent = structuredNote;
            
            // Upload PowerPoint to storage
            const uploadResult = await StorageService.uploadFile(
              data.pptBase64,
              `${data.title}.pptx`,
              userId,
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            );
            fileUrl = uploadResult.url;
            fileName = `${data.title}.pptx`;
            fileSize = uploadResult.size;
            fileType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            
            console.error("[NOTE_SERVICE] PowerPoint processing complete");
          }
        } catch (aiError) {
          console.error("AI processing error:", aiError);

          // Re-throw AppError instances directly to avoid error nesting
          if (aiError instanceof AppError) {
            throw aiError;
          }

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
      console.error("[NOTE_SERVICE] Error in createNote:", error);
      if (
        error instanceof NotesLimitExceededError ||
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof AIUsageLimitExceededError ||
        error instanceof AIProcessingError ||
        error instanceof DatabaseError
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
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof DatabaseError
      ) {
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
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof DatabaseError
      ) {
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
        error instanceof AIUsageLimitExceededError ||
        error instanceof AIProcessingError ||
        error instanceof DatabaseError
      ) {
        throw error;
      }
      throw new DatabaseError("Failed to process note", error);
    }
  }

  /**
   * Process note with knowledge base (new workflow)
   * Creates chunks and embeddings for reusable knowledge base
   */
  async processNoteWithKnowledgeBase(
    noteId: string,
    userId: string
  ): Promise<NoteDto> {
    try {
      // Verify ownership
      const note = await this.getNoteById(noteId, userId);

      // Check if knowledge base already exists
      const kbExists = await knowledgeBaseService.isKnowledgeBaseReady(noteId);
      if (kbExists) {
        return note;
      }

      // Update status to processing
      await prisma.note.update({
        where: { id: noteId },
        data: { processingStatus: "PROCESSING" },
      });

      // Create knowledge base with vision extraction if file exists
      const useVision = !!(note.fileUrl && (
        note.fileType?.startsWith("image/") || 
        note.fileType === "application/pdf"
      ));

      const result = await knowledgeBaseService.createKnowledgeBase({
        noteId,
        rawContent: note.rawContent || undefined,
        fileUrl: note.fileUrl || undefined,
        fileType: note.fileType || undefined,
        extractWithVision: useVision,
      });

      // Return updated note
      return await this.getNoteById(noteId, userId);
    } catch (error) {
      console.error("Failed to process note with knowledge base:", error);

      // Update status to failed
      await prisma.note.update({
        where: { id: noteId },
        data: {
          processingStatus: "FAILED",
          processingError:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof AIUsageLimitExceededError ||
        error instanceof AIProcessingError ||
        error instanceof DatabaseError
      ) {
        throw error;
      }
      throw new DatabaseError(
        "Failed to process note with knowledge base",
        error
      );
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
      if (
        error instanceof NotFoundError ||
        error instanceof ForbiddenError ||
        error instanceof DatabaseError
      ) {
        throw error;
      }
      throw new DatabaseError("Failed to fetch subject notes", error);
    }
  }
}

export const noteService = new NoteService();
