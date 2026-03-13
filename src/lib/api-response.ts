import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";
import { AppError } from "./errors";

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

  console.error("API Error Response:", {
    type: errorObj.constructor.name,
    message: errorObj.message,
    isAppError: errorObj instanceof AppError,
    originalError: error,
  });

  if (errorObj instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorObj.code,
          message: errorObj.message || "An error occurred",
          details: errorObj.details,
        },
      },
      { status: errorObj.statusCode },
    );
  }

  // For non-AppError errors, still return the error message instead of generic message
  console.error("Unhandled error:", errorObj.message, errorObj.stack);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: errorObj.message || "An unexpected error occurred",
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
