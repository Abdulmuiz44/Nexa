import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { encryptSecret } from '@/lib/crypto';
import { ErrorCode, handleApiError, NexaError } from '@/lib/error-handler';

const ALLOWED_PROVIDERS = ['novita', 'openrouter', 'groq', 'local', 'none'];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { aiProvider, aiModel, apiKey } = payload;

    if (!aiProvider || typeof aiProvider !== 'string') {
      throw new NexaError(
        'aiProvider is required and must be a string',
        ErrorCode.INVALID_INPUT,
        400
      );
    }

    if (!ALLOWED_PROVIDERS.includes(aiProvider)) {
      throw new NexaError(
        `Unsupported aiProvider. Supported values: ${ALLOWED_PROVIDERS.join(', ')}`,
        ErrorCode.INVALID_INPUT,
        400
      );
    }

    const updatePayload: Record<string, unknown> = {
      ai_provider: aiProvider,
      ai_model: aiModel || null,
    };

    if (apiKey) {
      updatePayload.ai_provider_api_key = encryptSecret(apiKey);
    } else if (aiProvider === 'none') {
      updatePayload.ai_provider_api_key = null;
    }

    const { error } = await supabaseServer
      .from('users')
      .update(updatePayload)
      .eq('id', session.user.id);

    if (error) {
      throw new NexaError(
        'Failed to save AI settings',
        ErrorCode.SUPABASE_ERROR,
        500,
        { supabase: error }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const handled = handleApiError(error, 'AI Settings');
    return NextResponse.json(
      { error: handled.error, code: handled.code },
      { status: handled.statusCode }
    );
  }
}
