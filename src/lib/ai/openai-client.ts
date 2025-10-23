import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  tokensUsed?: number;
}

export class OpenAIClient {
  private client: OpenAI;
  private model = 'gpt-4';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey,
    });
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      });

      const message = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens;

      return {
        message,
        tokensUsed,
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);

      // Handle specific error types
      if (error?.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }
      if (error?.status === 401) {
        throw new Error('OpenAI authentication failed. Check your API key.');
      }
      if (error?.status === 400) {
        throw new Error('OpenAI request error. Please check your input.');
      }

      throw new Error(`OpenAI API error: ${error?.message || 'Unknown error'}`);
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
    return ['gpt-4', 'gpt-3.5-turbo'];
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
