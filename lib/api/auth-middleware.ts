import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiUnauthorized } from './response';

// =====================================================
// SESSION TYPES
// =====================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

// =====================================================
// AUTHENTICATION UTILITIES
// =====================================================

/**
 * Get current user session from NextAuth
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return null;
    }

    return {
      id: (session.user as Record<string, unknown>).id as string,
      email: session.user.email || '',
      name: session.user.name,
      ...session.user,
    };
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return null;
  }
}

/**
 * Require authentication - throws if user not authenticated
 */
export async function requireAuth(requestId?: string) {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw apiUnauthorized('Authentication required', requestId);
  }

  return user;
}

/**
 * Optional authentication - returns user if available, null otherwise
 */
export async function optionalAuth(): Promise<AuthenticatedUser | null> {
  return getAuthenticatedUser();
}

/**
 * Check if user has permission (basic example - extend as needed)
 */
export function checkPermission(
  user: AuthenticatedUser,
  resourceOwnerId: string,
  isAdmin?: boolean
): boolean {
  // Allow if user owns resource
  if (user.id === resourceOwnerId) {
    return true;
  }

  // Allow if user is admin
  if (isAdmin) {
    return true;
  }

  return false;
}

/**
 * Middleware to require authentication in API routes
 * Usage: const user = await requireAuth(requestId);
 */
export async function authRequired(
  req?: NextRequest,
  requestId?: string
): Promise<{ user: AuthenticatedUser; error: null } | { user: null; error: ReturnType<typeof apiUnauthorized> }> {
  try {
    const user = await requireAuth(requestId);
    return { user, error: null };
  } catch (error) {
    if (error instanceof Response) {
      return { user: null, error };
    }
    return { user: null, error: apiUnauthorized('Authentication required', requestId) };
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Validate API key
 */
export async function validateApiKey(apiKey: string): Promise<{ userId: string; valid: boolean }> {
  // This is a placeholder - implement actual API key validation against your database
  // Example:
  // const { data } = await supabaseServer
  //   .from('api_keys')
  //   .select('user_id')
  //   .eq('key', apiKey)
  //   .eq('is_active', true)
  //   .single();
  // return { userId: data?.user_id, valid: !!data };

  return { userId: '', valid: false };
}
