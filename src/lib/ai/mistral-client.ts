import { Mistral } from '@mistralai/mistralai'

type MistralMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: unknown[]
}

interface FunctionsWithName {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

interface MistralChatPayload {
  model: string
  messages: MistralMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  functions?: FunctionsWithName[]
  tool_choice?: string
}

const clients = new Map<string, Mistral>()

function getClient(apiKey: string) {
  const cached = clients.get(apiKey)
  if (cached) {
    return cached
  }

  const client = new Mistral({ apiKey })
  clients.set(apiKey, client)
  return client
}

function toBase64Tools(functions?: FunctionsWithName[]) {
  if (!functions) return undefined
  return functions.map((fn) => ({
    name: fn.name,
    description: fn.description,
    parameters: fn.parameters,
  }))
}

function buildRequest(payload: MistralChatPayload) {
  const { model, messages, temperature, max_tokens, top_p, tool_choice, functions } = payload
  const mapped: Record<string, unknown> = {
    model,
    messages,
  }

  if (typeof temperature === 'number') {
    mapped.temperature = temperature
  }
  if (typeof max_tokens === 'number') {
    mapped.maxTokens = max_tokens
  }
  if (typeof top_p === 'number') {
    mapped.topP = top_p
  }
  if (tool_choice) {
    mapped.toolChoice = tool_choice
  }
  const tools = toBase64Tools(functions)
  if (tools) {
    mapped.tools = tools
  }

  return mapped
}

async function executeCall(apiKey: string, payload: MistralChatPayload) {
  const client = getClient(apiKey)
  const request = buildRequest(payload)
  const response = await client.chat.complete(request as any)
  const choice = response.choices?.[0]
  const messageContent = choice?.message?.content
  return {
    message: typeof messageContent === 'string' ? messageContent : '',
    model: response.model,
    usage: response.usage,
    tool_calls: choice?.message?.toolCalls,
  }
}

export async function callMistral(apiKey: string, payload: MistralChatPayload) {
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is required to call Mistral')
  }

  return executeCall(apiKey, payload)
}

export async function callMistralWithEnv(payload: MistralChatPayload) {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is required to use Mistral')
  }
  return executeCall(apiKey, payload)
}
