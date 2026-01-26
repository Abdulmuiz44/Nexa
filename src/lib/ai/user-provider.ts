import { supabaseServer } from '@/src/lib/supabaseServer';
import { decryptSecret } from '@/lib/crypto';
import { callMistral } from './mistral-client';

export type LLMSupportedProvider = 'mistral';

interface ProviderRow {
  id: string;
  ai_provider?: string | null;
  ai_model?: string | null;
  ai_provider_api_key?: string | null;
}

export async function getUserProvider(userId: string): Promise<ProviderRow | null> {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user for AI provider config', { userId, error });
      return null;
    }

    // Try to get AI columns separately to avoid crashing if they don't exist
    const { data: aiData } = await supabaseServer
      .from('users')
      .select('ai_provider, ai_model, ai_provider_api_key')
      .eq('id', userId)
      .single();

    return {
      ...data,
      ...(aiData || {})
    } as ProviderRow;
  } catch (err) {
    console.warn('AI provider columns might be missing in users table, falling back to system defaults.');
    return { id: userId };
  }
}

interface CallLLMArgs {
  userId: string;
  payload: {
    model?: string;
    messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_calls?: unknown[] }[];
    temperature?: number;
    max_tokens?: number;
    functions?: unknown[];
    tool_choice?: string;
    response_format?: { type: 'json_object' | 'text' };
  };
}

export interface ProviderLLMResponse {
  message: string;
  model: string;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  tool_calls?: unknown[];
}

export async function callUserLLM({ userId, payload }: CallLLMArgs): Promise<ProviderLLMResponse> {
  const provider = await getUserProvider(userId);

  // Forcing Mistral for now to ensure reliability during transition
  let apiKey = process.env.MISTRAL_API_KEY || '';

  // Try to get user's key first if they have one saved
  if (provider?.ai_provider_api_key) {
    try {
      const userApiKey = decryptSecret(provider.ai_provider_api_key);
      if (userApiKey) {
        apiKey = userApiKey;
      }
    } catch (e) {
      console.warn('Failed to decrypt user API key, falling back to system key', e);
    }
  }

  // Fallback to system key
  if (!apiKey) {
    apiKey = process.env.MISTRAL_API_KEY || '';
  }

  if (!apiKey) {
    throw new Error('Mistral API key is missing. Please configure MISTRAL_API_KEY in environment variables.');
  }

  // Default to mistral-large-latest if no model specified
  const model = payload.model || provider?.ai_model || 'mistral-large-latest';

  // Call Mistral directly
  const response = await callMistral(apiKey, { ...payload, model });

  return {
    message: response.message,
    model: response.model || model,
    usage: response.usage,
    tool_calls: response.tool_calls,
  };
}
