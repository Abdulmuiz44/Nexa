import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  tokensUsed?: number;
}

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private modelName = 'gemini-pro';

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });

      // Convert messages to Gemini format
      const history = this.convertMessagesToGemini(messages);

      const chat = model.startChat({
        history,
      });

      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;
      const message = response.text();

      // Estimate tokens (Gemini doesn't provide exact token counts)
      const tokensUsed = this.estimateTokens(message);

      return {
        message,
        tokensUsed,
      };
    } catch (error: any) {
      console.error('Gemini API error:', error);

      // Handle specific error types
      if (error?.status === 429) {
        throw new Error('Gemini rate limit exceeded. Please try again later.');
      }
      if (error?.status === 401) {
        throw new Error('Gemini authentication failed. Check your API key.');
      }
      if (error?.status === 400) {
        throw new Error('Gemini request error. Please check your input.');
      }

      throw new Error(`Gemini API error: ${error?.message || 'Unknown error'}`);
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

  private convertMessagesToGemini(messages: ChatMessage[]) {
    const history = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const message = messages[i];
      if (message.role === 'system') {
        // Skip system messages for now
        continue;
      }

      history.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      });
    }

    return history;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Get available models
  getAvailableModels(): string[] {
    return ['gemini-pro', 'gemini-pro-vision'];
  }

  // Switch model
  setModel(model: string): void {
    if (this.getAvailableModels().includes(model)) {
      this.modelName = model;
    } else {
      throw new Error(`Model ${model} is not available`);
    }
  }
}
