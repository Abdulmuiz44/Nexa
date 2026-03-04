import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { validationError } from './response';

// =====================================================
// VALIDATION UTILITIES
// =====================================================

export interface ValidationOptions {
  /**
   * Parse request body as JSON
   */
  parseBody?: boolean;

  /**
   * Validate query parameters
   */
  validateQuery?: boolean;

  /**
   * Custom error handler
   */
  onError?: (error: ZodError, requestId?: string) => NextResponse;
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema,
  requestId?: string
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        data: null,
        error: validationError(result.error, requestId),
      };
    }

    return {
      data: result.data as T,
      error: null,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse request body';
    return {
      data: null,
      error: validationError(
        {
          body: [errorMessage],
        },
        requestId
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema,
  requestId?: string
): { data: T; error: null } | { data: null; error: NextResponse } {
  const queryObject = Object.fromEntries(searchParams);
  const result = schema.safeParse(queryObject);

  if (!result.success) {
    return {
      data: null,
      error: validationError(result.error, requestId),
    };
  }

  return {
    data: result.data as T,
    error: null,
  };
}

/**
 * Validate both body and query parameters
 */
export async function validateRequest<B, Q>(
  req: NextRequest,
  bodySchema?: ZodSchema,
  querySchema?: ZodSchema,
  requestId?: string
): Promise<{
  body: B | null;
  query: Q | null;
  error: NextResponse | null;
}> {
  // Validate body if schema provided
  if (bodySchema) {
    try {
      const body = await req.json();
      const result = bodySchema.safeParse(body);

      if (!result.success) {
        return {
          body: null,
          query: null,
          error: validationError(result.error, requestId),
        };
      }

      // Validate query if schema provided
      if (querySchema) {
        const queryValidation = validateQuery(
          req.nextUrl.searchParams,
          querySchema,
          requestId
        );

        if (queryValidation.error) {
          return {
            body: result.data as B,
            query: null,
            error: queryValidation.error,
          };
        }

        return {
          body: result.data as B,
          query: queryValidation.data as Q,
          error: null,
        };
      }

      return {
        body: result.data as B,
        query: null,
        error: null,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse request body';
      return {
        body: null,
        query: null,
        error: validationError(
          {
            body: [errorMessage],
          },
          requestId
        ),
      };
    }
  }

  // Only validate query if body schema not provided
  if (querySchema) {
    const queryValidation = validateQuery(
      req.nextUrl.searchParams,
      querySchema,
      requestId
    );

    return {
      body: null,
      query: queryValidation.data as Q,
      error: queryValidation.error,
    };
  }

  return {
    body: null,
    query: null,
    error: null,
  };
}

/**
 * Format Zod validation errors into a readable object
 */
export function formatValidationErrors(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

/**
 * Check if error is a ZodError
 */
export function isValidationError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
