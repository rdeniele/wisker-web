import { PlanType, LearningToolType, LearningToolSource } from '@prisma/client';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User Types
export interface UserDto {
  id: string;
  email: string;
  planType: PlanType;
  notesLimit: number;
  subjectsLimit: number;
  aiUsageLimit: number;
  aiUsageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserPlanRequest {
  planType: PlanType;
}

// Subject Types
export interface SubjectDto {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    notes: number;
    learningTools: number;
  };
}

export interface CreateSubjectRequest {
  title: string;
  description?: string;
}

export interface UpdateSubjectRequest {
  title?: string;
  description?: string;
}

// Note Types
export interface NoteDto {
  id: string;
  subjectId: string;
  title: string;
  rawContent: string;
  knowledgeBase?: string;
  aiProcessedContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteRequest {
  subjectId: string;
  title: string;
  rawContent?: string;
  pdfText?: string; // Optional: Extracted PDF text (text-only PDFs)
  pdfBase64?: string; // Optional: PDF file as base64 (legacy, for storage only)
  imageBase64?: string; // Optional: Image file as base64 (vision AI)
}

export interface UpdateNoteRequest {
  title?: string;
  rawContent?: string;
}

export interface ProcessNoteRequest {
  noteId: string;
}

// Learning Tool Types
export interface LearningToolDto {
  id: string;
  type: LearningToolType;
  source: LearningToolSource;
  subjectId?: string;
  noteId?: string;
  generatedContent: string;
  createdAt: Date;
  notes?: {
    id: string;
    title: string;
  }[];
}

export interface GenerateLearningToolRequest {
  type: LearningToolType;
  source: LearningToolSource;
  subjectId?: string;
  noteId?: string;
  noteIds?: string[]; // For subject-level generation with selected notes
}

// AI Processing Types
export interface OrganizedNoteContent {
  title: string;
  sections: {
    heading: string;
    content: string;
    keyPoints: string[];
  }[];
  highlights: string[];
  summary: string;
}

export interface QuizContent {
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export interface FlashcardContent {
  cards: {
    id: string;
    front: string;
    back: string;
  }[];
}

export interface SummaryContent {
  summary: string;
  keyPoints: string[];
  mainTopics: string[];
}

// Usage Tracking Types
export interface UsageStats {
  notesUsed: number;
  notesLimit: number;
  subjectsUsed: number;
  subjectsLimit: number;
  aiUsageCount: number;
  aiUsageLimit: number;
}

// Error Codes
export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Limit errors
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  SUBJECTS_LIMIT_EXCEEDED = 'SUBJECTS_LIMIT_EXCEEDED',
  NOTES_LIMIT_EXCEEDED = 'NOTES_LIMIT_EXCEEDED',
  AI_USAGE_LIMIT_EXCEEDED = 'AI_USAGE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_PROCESSING_ERROR = 'AI_PROCESSING_ERROR',
}
