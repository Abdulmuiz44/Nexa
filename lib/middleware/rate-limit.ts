/**
 * Rate Limiting Middleware
 * Prevents abuse of authentication and sensitive endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

/**
 * Rate limit middleware factory
 * @param config Rate limit configuration
 * @returns Middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = config;

  return (request: NextRequest) => {
    // Get identifier (user ID from session or IP)
    const identifier = getIdentifier(request);

    if (!identifier) {
      return { allowed: true }; // Skip if can't identify
    }

    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    // Reset if window expired
    if (!record || now > record.resetTime) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true };
    }

    // Check if over limit
    if (record.count >= maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: message,
            retryAfter: resetIn,
          },
          { status: 429, headers: { 'Retry-After': String(resetIn) } }
        ),
      };
    }

    // Increment counter
    record.count++;
    return { allowed: true };
  };
}

/**
 * Get identifier for rate limiting
 * Prefers user ID from auth headers, falls back to IP
 */
function getIdentifier(request: NextRequest): string | null {
  // Try to get user ID from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const userIdMatch = authHeader.match(/user-id[="']?([^,\s"']+)/i);
    if (userIdMatch) {
      return `user:${userIdMatch[1]}`;
    }
  }

  // Fall back to IP
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.ip;

  return ip ? `ip:${ip}` : null;
}

/**
 * Cleanup function to periodically remove expired entries
 * Call this periodically (e.g., every 5 minutes) to prevent memory leak
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  console.log(`Rate limit store cleanup: removed ${cleaned} expired entries`);
}

/**
 * Common rate limit configs
 */
export const RATE_LIMITS = {
  // OAuth endpoints - strict (max 5 attempts per 15 minutes)
  oauth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many connection attempts. Please try again in 15 minutes.',
  },

  // General API - standard (max 100 requests per minute)
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.',
  },

  // Login/Auth - strict (max 10 attempts per hour)
  auth: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many login attempts. Please try again in 1 hour.',
  },

  // Sensitive operations - very strict (max 3 per hour)
  sensitive: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: 'Too many sensitive operations. Please try again later.',
  },
};
