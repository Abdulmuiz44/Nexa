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
  const { data, error } = await supabaseServer
    .from('users')
    .select('id, ai_provider, ai_model, ai_provider_api_key')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching AI provider config for user', { userId, error });
    return null;
  }

  return data as ProviderRow;
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

  // Enforce Mistral
  const selectedProvider = 'mistral';

  let apiKey = '';

  // Try to get user's key first if they have one saved
  if (provider?.ai_provider_api_key) {
    try {
      apiKey = decryptSecret(provider.ai_provider_api_key);
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
