/**
 * Centralized Error Handling Framework for Nexa
 * Provides type-safe error handling, recovery strategies, and consistent user-facing messages
 */

import { logger } from './logger';

/**
 * Standard error codes for Nexa
 */
export enum ErrorCode {
  // Client errors
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // Domain-specific errors
  AUTH_FAILED = 'AUTH_FAILED',
  OAUTH_FAILED = 'OAUTH_FAILED',
  COMPOSIO_ERROR = 'COMPOSIO_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  OPENAI_ERROR = 'OPENAI_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  CREDIT_INSUFFICIENT = 'CREDIT_INSUFFICIENT',
  AGENT_ERROR = 'AGENT_ERROR',
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T> {
  data: T;
  success: true;
  timestamp: string;
}

/**
 * Recovery strategy enum
 */
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  QUEUE = 'QUEUE',
  SKIP = 'SKIP',
}

/**
 * Custom Nexa error class
 */
export class NexaError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: Record<string, unknown>;
  recoveryStrategy: RecoveryStrategy;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    recoveryStrategy: RecoveryStrategy = RecoveryStrategy.SKIP
  ) {
    super(message);
    this.name = 'NexaError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.recoveryStrategy = recoveryStrategy;
  }
}

/**
 * Map common errors to ErrorCode and status codes
 */
function mapErrorCode(error: Error | unknown): { code: ErrorCode; status: number } {
  if (error instanceof NexaError) {
    return { code: error.code, status: error.statusCode };
  }

  if (error instanceof SyntaxError) {
    return { code: ErrorCode.INVALID_INPUT, status: 400 };
  }

  if (error instanceof TypeError) {
    return { code: ErrorCode.INVALID_INPUT, status: 400 };
  }

  const errorString = String(error).toLowerCase();

  if (errorString.includes('unauthorized') || errorString.includes('authentication')) {
    return { code: ErrorCode.UNAUTHORIZED, status: 401 };
  }

  if (errorString.includes('forbidden') || errorString.includes('permission denied')) {
    return { code: ErrorCode.FORBIDDEN, status: 403 };
  }

  if (errorString.includes('not found')) {
    return { code: ErrorCode.NOT_FOUND, status: 404 };
  }

  if (errorString.includes('timeout')) {
    return { code: ErrorCode.TIMEOUT, status: 504 };
  }

  if (
    errorString.includes('oauth') ||
    errorString.includes('oauth2') ||
    errorString.includes('composio')
  ) {
    return { code: ErrorCode.OAUTH_FAILED, status: 400 };
  }

  if (errorString.includes('supabase') || errorString.includes('database')) {
    return { code: ErrorCode.SUPABASE_ERROR, status: 500 };
  }

  if (errorString.includes('openai') || errorString.includes('gpt')) {
    return { code: ErrorCode.OPENAI_ERROR, status: 502 };
  }

  if (errorString.includes('payment') || errorString.includes('flutterwave')) {
    return { code: ErrorCode.PAYMENT_ERROR, status: 402 };
  }

  if (errorString.includes('insufficient') || errorString.includes('credit')) {
    return { code: ErrorCode.CREDIT_INSUFFICIENT, status: 402 };
  }

  return { code: ErrorCode.INTERNAL_ERROR, status: 500 };
}

/**
 * Handle an error and return a standardized response
 * Logs the error and returns a user-safe error message
 */
export function handleApiError(
  error: Error | unknown,
  context?: string,
  requestId?: string
): ApiErrorResponse {
  const { code, status: statusCode } = mapErrorCode(error);

  // Log the full error for debugging
  const message = error instanceof Error ? error.message : String(error);
  logger.error('error', `API Error: ${context || 'Unknown'}: ${message}`, {
    code,
    statusCode,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Return user-safe message
  const userMessage = getUserFriendlyMessage(code);

  return {
    error: userMessage,
    code,
    statusCode,
    details:
      process.env.NODE_ENV === 'development'
        ? {
            originalMessage: message,
            type: error instanceof Error ? error.constructor.name : typeof error,
          }
        : undefined,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get user-friendly error message for error code
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_INPUT]: 'Invalid input provided. Please check your data and try again.',
    [ErrorCode.UNAUTHORIZED]: 'You are not authenticated. Please log in and try again.',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.CONFLICT]: 'A resource with this data already exists.',
    [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
    [ErrorCode.TIMEOUT]: 'The request took too long. Please try again.',
    [ErrorCode.AUTH_FAILED]: 'Authentication failed. Please check your credentials and try again.',
    [ErrorCode.OAUTH_FAILED]: 'Failed to connect to social media. Please try connecting again.',
    [ErrorCode.COMPOSIO_ERROR]: 'Failed to perform the requested action. Please try again.',
    [ErrorCode.SUPABASE_ERROR]: 'Database error occurred. Please try again later.',
    [ErrorCode.OPENAI_ERROR]: 'AI service is temporarily unavailable. Please try again.',
    [ErrorCode.PAYMENT_ERROR]: 'Payment processing failed. Please check your payment method.',
    [ErrorCode.CREDIT_INSUFFICIENT]: 'Insufficient credits. Please top up your account.',
    [ErrorCode.AGENT_ERROR]: 'Agent operation failed. Please check your configuration and try again.',
  };

  return messages[code] || 'An error occurred. Please try again.';
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(error: Error | unknown): boolean {
  if (error instanceof NexaError) {
    return (
      error.recoveryStrategy === RecoveryStrategy.RETRY ||
      error.recoveryStrategy === RecoveryStrategy.QUEUE
    );
  }

  const errorString = String(error).toLowerCase();

  // Transient errors
  if (
    errorString.includes('timeout') ||
    errorString.includes('temporarily unavailable') ||
    errorString.includes('econnrefused') ||
    errorString.includes('enotfound')
  ) {
    return true;
  }

  // Rate limiting
  if (errorString.includes('rate limit') || errorString.includes('too many requests')) {
    return true;
  }

  return false;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };

  let lastError: Error | unknown;
  let delay = finalConfig.initialDelayMs;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRecoverableError(error) || attempt === finalConfig.maxRetries) {
        throw error;
      }

      // Calculate delay with jitter
      const jitter = Math.random() * 0.1 * delay;
      const actualDelay = Math.min(delay + jitter, finalConfig.maxDelayMs);

      logger.warn('system', `Retrying after ${actualDelay}ms (attempt ${attempt + 1}/${finalConfig.maxRetries})`, {
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, actualDelay));
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly name: string,
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        logger.info('system', `Circuit breaker ${this.name} transitioned to HALF_OPEN`);
      } else {
        throw new NexaError(
          `Circuit breaker ${this.name} is open`,
          ErrorCode.SERVICE_UNAVAILABLE,
          503,
          undefined,
          RecoveryStrategy.RETRY
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('system', `Circuit breaker ${this.name} is now CLOSED`);
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn('system', `Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    logger.info('system', `Circuit breaker ${this.name} manually reset`);
  }
}
