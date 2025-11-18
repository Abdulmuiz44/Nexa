import { supabaseServer } from '@/src/lib/supabaseServer';
import { decryptSecret } from '@/lib/crypto';
import { callMistral } from './mistral-client';

export type LLMSupportedProvider = 'novita' | 'openrouter' | 'groq' | 'openai' | 'gemini' | 'mistral' | 'none';

const NOVITA_BASE_URL = process.env.NOVITA_BASE_URL || 'https://api.novita.ai/v3/openai';

interface ProviderRow {
  id: string;
  ai_provider?: LLMSupportedProvider | null;
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

function buildHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

interface NovitaResponse {
  id?: string;
  model: string;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  choices: Array<{
    message?: {
      content?: string;
      tool_calls?: unknown[];
    };
  }>;
}

async function callNovita(apiKey: string, body: Record<string, unknown>): Promise<ProviderLLMResponse> {
  const response = await fetch(`${NOVITA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'no body');
    const err = new Error(`Novita request failed: ${response.status} ${response.statusText}`);
    (err as any).details = { status: response.status, body: text };
    throw err;
  }

  const payload = (await response.json()) as NovitaResponse;
  const choice = payload.choices?.[0];

  return {
    message: choice?.message?.content || '',
    model: payload.model,
    usage: payload.usage,
    tool_calls: choice?.message?.tool_calls,
  };
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
  if (!provider) {
    throw new Error('Unable to load AI provider configuration.');
  }

  const selectedProvider = provider.ai_provider || 'novita';
  if (selectedProvider === 'none') {
    throw new Error('AI provider not configured. Please connect an LLM provider in settings.');
  }

  const encryptedKey = provider.ai_provider_api_key;
  if (!encryptedKey) {
    throw new Error('Provider API key is missing. Please re-save your provider settings.');
  }

  const apiKey = decryptSecret(encryptedKey);
  const model = payload.model || provider.ai_model || 'gpt-4o-mini';

  switch (selectedProvider) {
    case 'novita':
    case 'openrouter':
      return callNovita(apiKey, { ...payload, model });
    case 'mistral':
      return callMistral(apiKey, { ...payload, model });
    default:
      throw new Error(`Provider ${selectedProvider} is not wired yet.`);
  }
}
