import { Mistral } from '@mistralai/mistralai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  tokensUsed?: number;
}

export class MistralClient {
  private client: Mistral;
  private model = 'mistral-large-latest';

  constructor() {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY environment variable is required');
    }

    this.client = new Mistral({
      apiKey: apiKey,
    });
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await this.client.chat.complete({
        model: this.model,
        messages: messages,
        temperature: 0.7,
      });

      const message = response.choices?.[0]?.message?.content || '';
      const tokensUsed = response.usage?.totalTokens;

      return {
        message: typeof message === 'string' ? message : JSON.stringify(message),
        tokensUsed,
      };
    } catch (error: any) {
      console.error('Mistral API error:', error);

      // Handle specific error types
      if (error?.status === 429) {
        throw new Error('Mistral rate limit exceeded. Please try again later.');
      }
      if (error?.status === 401) {
        throw new Error('Mistral authentication failed. Check your API key.');
      }
      if (error?.status === 400) {
        throw new Error('Mistral request error. Please check your input.');
      }

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
      throw new Error(`Model ${model} is not available`);
    }
  }
}

// Export a singleton instance for backward compatibility
export const mistral = new MistralClient();
// Keep old export name for compatibility during migration
export const openai = mistral;

