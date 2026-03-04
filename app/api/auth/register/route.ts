import { NextRequest } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import bcrypt from 'bcryptjs';
import { generateApiKey } from '@/lib/utils';
import { registerSchema } from '@/lib/schemas/auth';
import { validateBody, isValidationError } from '@/lib/api/validation';
import { apiSuccess, apiError, apiConflict, validationError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || undefined;

  try {
    // Validate request body
    const { data: body, error: validationErr } = await validateBody(req, registerSchema, requestId);

    if (validationErr) {
      return validationErr;
    }

    if (!body) {
      return apiError('Invalid request body', 400, 'BAD_REQUEST', requestId);
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Database error:', fetchError);
      return apiError('Failed to check user existence', 500, 'DATABASE_ERROR', requestId);
    }

    if (existingUser) {
      return apiConflict('User with this email already exists', requestId);
    }

    // Hash password and generate API key
    const password_hash = await bcrypt.hash(body.password, 10);
    const api_key = generateApiKey();

    // Create new user
    const { data: newUser, error: insertError } = await supabaseServer
      .from('users')
      .insert({
        name: body.name,
        email: body.email,
        password_hash,
        api_key,
        status: 'onboarding',
      })
      .select()
      .single();

    if (insertError || !newUser) {
      console.error('Error creating user:', insertError);
      return apiError('Failed to create user', 500, 'USER_CREATION_ERROR', requestId);
    }

    return apiSuccess(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status,
      },
      201,
      'USER_CREATED',
      requestId
    );
  } catch (error: unknown) {
    console.error('Register API error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return apiError(message, 500, 'INTERNAL_ERROR', requestId);
  }
}
