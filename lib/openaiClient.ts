import { Mistral } from '@mistralai/mistralai'

let mistralClientInstance: Mistral | null = null

function getMistralClient(): Mistral {
  if (mistralClientInstance) {
    return mistralClientInstance
  }

  mistralClientInstance = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY || '',
  })
  return mistralClientInstance
}

// Export a proxy that lazily creates the client
export const mistralClient = new Proxy({} as Mistral, {
  get(_target, prop) {
    const client = getMistralClient()
    return (client as any)[prop]
  }
})

// Keep old export name for compatibility during migration
export const openaiClient = mistralClient

