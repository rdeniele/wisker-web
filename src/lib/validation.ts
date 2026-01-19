import { z } from 'zod';
import { LearningToolType, LearningToolSource, PlanType } from '@prisma/client';

// Subject Validation
export const createSubjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
});

export const updateSubjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
});

// Note Validation
export const createNoteSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  rawContent: z
    .string()
    .max(100000, 'Content is too large')
    .optional(),
  pdfBase64: z
    .string()
    .optional(),
  imageBase64: z
    .string()
    .optional(),
}).refine(
  (data) => {
    // At least one of rawContent, pdfBase64, or imageBase64 must be provided
    return data.rawContent || data.pdfBase64 || data.imageBase64;
  },
  {
    message: 'At least one of rawContent, pdfBase64, or imageBase64 must be provided',
  }
);

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),
  rawContent: z
    .string()
    .min(1, 'Content is required')
    .max(100000, 'Content is too large')
    .optional(),
});

export const processNoteSchema = z.object({
  noteId: z.string().uuid('Invalid note ID'),
});

// Learning Tool Validation
export const generateLearningToolSchema = z
  .object({
    type: z.nativeEnum(LearningToolType, {
      errorMap: () => ({
        message: 'Invalid learning tool type',
      }),
    }),
    source: z.nativeEnum(LearningToolSource, {
      errorMap: () => ({
        message: 'Invalid source type',
      }),
    }),
    subjectId: z.string().uuid('Invalid subject ID').optional(),
    noteId: z.string().uuid('Invalid note ID').optional(),
    noteIds: z.array(z.string().uuid('Invalid note ID')).optional(),
  })
  .refine(
    (data) => {
      // If source is SUBJECT, subjectId must be provided
      if (data.source === 'SUBJECT' && !data.subjectId) {
        return false;
      }
      // If source is SINGLE_NOTE, noteId must be provided
      if (data.source === 'SINGLE_NOTE' && !data.noteId) {
        return false;
      }
      return true;
    },
    {
      message:
        'Invalid source configuration: subjectId required for SUBJECT source, noteId required for SINGLE_NOTE source',
    }
  );

// User Validation
export const updateUserPlanSchema = z.object({
  planType: z.nativeEnum(PlanType, {
    errorMap: () => ({
      message: 'Invalid plan type',
    }),
  }),
});

// Query Params Validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const subjectQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const noteQuerySchema = paginationSchema.extend({
  subjectId: z.string().uuid('Invalid subject ID').optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const learningToolQuerySchema = paginationSchema.extend({
  subjectId: z.string().uuid('Invalid subject ID').optional(),
  noteId: z.string().uuid('Invalid note ID').optional(),
  type: z.nativeEnum(LearningToolType).optional(),
  source: z.nativeEnum(LearningToolSource).optional(),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Helper function to validate request data
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}
