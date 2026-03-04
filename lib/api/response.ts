import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  success: boolean;
  code: string;
  statusCode: number;
  timestamp: string;
}

// =====================================================
// RESPONSE BUILDERS
// =====================================================

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a standardized successful API response
 */
export function apiSuccess<T>(
  data: T,
  statusCode: number = 200,
  code: string = 'SUCCESS',
  requestId?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    },
    { status: statusCode }
  );
}

/**
 * Create a standardized error API response
 */
export function apiError(
  error: string | Error,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  requestId?: string
): NextResponse<ApiResponse<null>> {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    },
    { status: statusCode }
  );
}

/**
 * Create a validation error response
 */
export function validationError(
  errors: ZodError | Record<string, string[]>,
  requestId?: string
): NextResponse<ApiResponse<null>> {
  const errorMap = errors instanceof ZodError
    ? errors.flatten().fieldErrors
    : errors;

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
      data: errorMap,
    },
    { status: 400 }
  );
}

/**
 * Create a paginated response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: {
    limit: number;
    offset: number;
    total: number;
  },
  statusCode: number = 200,
  requestId?: string
): NextResponse<PaginatedResponse<T>> {
  const hasMore = pagination.offset + pagination.limit < pagination.total;

  return NextResponse.json(
    {
      data,
      pagination: {
        ...pagination,
        hasMore,
      },
      success: true,
      code: 'SUCCESS',
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    },
    { status: statusCode }
  );
}

/**
 * Create a created (201) response
 */
export function apiCreated<T>(
  data: T,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  return apiSuccess(data, 201, 'CREATED', requestId);
}

/**
 * Create a no content (204) response
 */
export function apiNoContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create an unauthorized (401) response
 */
export function apiUnauthorized(
  message: string = 'Unauthorized',
  requestId?: string
): NextResponse<ApiResponse<null>> {
  return apiError(message, 401, 'UNAUTHORIZED', requestId);
}

/**
 * Create a forbidden (403) response
 */
export function apiForbidden(
  message: string = 'Forbidden',
  requestId?: string
): NextResponse<ApiResponse<null>> {
  return apiError(message, 403, 'FORBIDDEN', requestId);
}

/**
 * Create a not found (404) response
 */
export function apiNotFound(
  message: string = 'Not found',
  requestId?: string
): NextResponse<ApiResponse<null>> {
  return apiError(message, 404, 'NOT_FOUND', requestId);
}

/**
 * Create a conflict (409) response
 */
export function apiConflict(
  message: string = 'Resource already exists',
  requestId?: string
): NextResponse<ApiResponse<null>> {
  return apiError(message, 409, 'CONFLICT', requestId);
}

/**
 * Create a rate limit (429) response
 */
export function apiRateLimited(
  message: string = 'Too many requests',
  retryAfter?: number,
  requestId?: string
): NextResponse<ApiResponse<null>> {
  const response = apiError(message, 429, 'RATE_LIMITED', requestId);
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }
  return response;
}
