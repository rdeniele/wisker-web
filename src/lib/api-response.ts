import { NextResponse } from "next/server";
import { ApiResponse, ErrorCode } from "@/types/api";
import { AppError } from "./errors";

const AI_VENDOR_PATTERN =
  /https?:\/\/\S+|\b(together(\.ai|\.xyz)?( ai)?|gemini|anthropic|claude|googleapis|moonshot(ai)?|kimi|qwen|llama|BAAI)\b/gi;
const AI_ENV_VAR_PATTERN = /\b[A-Z_]*(TOGETHER|GEMINI|ANTHROPIC)[A-Z_]*\b/g;

/** Strip AI vendor names, endpoints and env var names from client-facing text. */
function scrubAIVendor(message: string): string {
  return message
    .replace(AI_ENV_VAR_PATTERN, "AI service")
    .replace(AI_VENDOR_PATTERN, "AI service");
}

export function successResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

export function errorResponse(
  error: unknown,
  status?: number,
): NextResponse<ApiResponse> {
  // Ensure we have a valid error object
  let errorObj: Error;
  
  if (error instanceof Error) {
    errorObj = error;
  } else if (typeof error === 'string') {
    errorObj = new Error(error);
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorObj = new Error(String(error.message));
  } else {
    errorObj = new Error('An unexpected error occurred');
  }

  if (errorObj instanceof AppError) {
    const isAI = errorObj.code === ErrorCode.AI_PROCESSING_ERROR;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code,
          message: scrubAIVendor(errorObj.message || "An error occurred"),
          // AI error details carry upstream provider responses; never expose.
          details: isAI ? undefined : errorObj.details,
        },
      },
      { status: errorObj.statusCode },
    );
  }

  // For non-AppError errors, still return the error message instead of generic message
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: scrubAIVendor(errorObj.message || "An unexpected error occurred"),
      },
    },
    { status: status || 500 },
  );
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

// Alias for backward compatibility
export const apiResponse = successResponse;
