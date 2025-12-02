import { Mistral } from '@mistralai/mistralai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
}

export interface ChatResponse {
  message: string;
  tokensUsed?: number;
  model?: string;
  tool_calls?: any[];
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
}

export class MistralClient {
  private client: Mistral;
  private model = 'mistral-large-latest';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.MISTRAL_API_KEY;
    if (!key) {
      throw new Error('MISTRAL_API_KEY environment variable is required');
    }

    this.client = new Mistral({
      apiKey: key,
    });
  }

  async chat(messages: ChatMessage[], options?: { model?: string; temperature?: number; max_tokens?: number; tools?: any[]; toolChoice?: any }): Promise<ChatResponse> {
    try {
      const response = await this.client.chat.complete({
        model: options?.model || this.model,
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        maxTokens: options?.max_tokens,
        tools: options?.tools,
        toolChoice: options?.toolChoice,
      });

      const choice = response.choices?.[0];
      const message = choice?.message?.content || '';
      const toolCalls = choice?.message?.toolCalls;
      const tokensUsed = response.usage?.totalTokens;

      return {
        message: typeof message === 'string' ? message : JSON.stringify(message),
        tokensUsed,
        model: response.model,
        tool_calls: toolCalls,
        usage: {
          total_tokens: response.usage?.totalTokens,
          prompt_tokens: response.usage?.promptTokens,
          completion_tokens: response.usage?.completionTokens
        }
      };
    } catch (error: any) {
      console.error('Mistral API error:', error);
      throw new Error(`Mistral API error: ${error?.message || 'Unknown error'}`);
    }
  }

  async generateContent(prompt: string): Promise<ChatResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a social media content expert. Generate engaging, platform-appropriate content.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return this.chat(messages);
  }

  async analyzeText(text: string): Promise<ChatResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'Analyze the given text and provide insights about its suitability for social media.'
      },
      {
        role: 'user',
        content: text
      }
    ];

    return this.chat(messages);
  }

  // Get available models
  getAvailableModels(): string[] {
    return ['mistral-large-latest', 'mistral-small-latest', 'mistral-medium-latest'];
  }

  // Switch model
  setModel(model: string): void {
    if (this.getAvailableModels().includes(model)) {
      this.model = model;
    } else {
      console.warn(`Model ${model} not found, using default`);
    }
  }
}

// Export a singleton instance
export const mistral = new MistralClient();

// Export standalone function for user-provider compatibility
export async function callMistral(apiKey: string, payload: any): Promise<ChatResponse> {
  const client = new MistralClient(apiKey);

  // Map payload to chat options
  const messages = payload.messages;
  const options = {
    model: payload.model,
    temperature: payload.temperature,
    max_tokens: payload.max_tokens,
    tools: payload.functions || payload.tools, // Handle both function calling styles if needed
    toolChoice: payload.tool_choice
  };

  return client.chat(messages, options);
}
