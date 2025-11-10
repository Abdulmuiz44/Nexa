import OpenAI from 'openai'

let openaiClientInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (openaiClientInstance) {
    return openaiClientInstance
  }

  openaiClientInstance = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  })
  return openaiClientInstance
}

// Export a proxy that lazily creates the client
export const openaiClient = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAIClient()
    return (client as any)[prop]
  }
})
