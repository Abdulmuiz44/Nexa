import { NexaBase } from './nexaBase';
import { MistralClient, ChatMessage } from '@/src/lib/ai/mistral-client';
import { createLogger } from '@/lib/logger';
import {
  AgentState,
  ContentGenerationRequest,
  ContentGenerationResult,
  AgentToolSchema,
} from './types';

const logger = createLogger();

/**
 * Content Agent: Generates platform-specific social media content using Mistral
 */
export class ContentAgent extends NexaBase {
  private mistral: MistralClient;

  constructor(userId: string) {
    super(userId);
    this.mistral = new MistralClient();
  }

  /**
   * Main entry point: Generate content for specified platforms
   */
  async generateContent(
    request: ContentGenerationRequest
  ): Promise<ContentGenerationResult> {
    const state: AgentState = {
      userId: request.userId,
      userBrief: request.brief,
      toolkits: request.toolkits,
      executionLog: [],
      timestamp: Date.now(),
    };

    try {
      await this.log('content_generation', 'Starting content generation', {
        toolkits: request.toolkits,
        brief: request.brief.substring(0, 100),
      });

      state.executionLog.push('✓ Content generation started');

      // Step 1: Generate content drafts
      const drafts = await this._generateContentDrafts(
        request.brief,
        request.toolkits,
        request.tone || 'professional',
        request.additionalContext
      );

      state.executionLog.push('✓ Content drafts generated');
      state.contentVariations = drafts;

      // Step 2: Analyze content for engagement potential
      const analysis = await this._analyzeContent(drafts);
      state.executionLog.push('✓ Content analyzed');

      // Step 3: Log execution
      const tokensUsed = await this._estimateTokens(request.brief, drafts);

      await this.log('content_generation', 'Content generation completed', {
        toolkits: request.toolkits,
        tokensUsed,
        draftCount: Object.keys(drafts).length,
      });

      return {
        ...drafts,
        analysis,
        metadata: {
          generatedAt: Date.now(),
          model: 'mistral-large-latest',
          tokensUsed,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logError('content_generation', errorMsg, {
        brief: request.brief.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Generate content drafts for each platform using Mistral
   */
  private async _generateContentDrafts(
    brief: string,
    toolkits: string[],
    tone: string,
    context?: string
  ): Promise<Record<string, string>> {
    const drafts: Record<string, string> = {};

    for (const toolkit of toolkits) {
      const prompt = this._buildContentPrompt(brief, toolkit, tone, context);

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: this._getSystemPrompt(toolkit),
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      try {
        const response = await this.mistral.chat(messages, {
          temperature: 0.7,
          max_tokens: toolkit === 'reddit' ? 2000 : 280,
        });

        drafts[toolkit] = response.message;
        await this.log('content_draft', `Draft generated for ${toolkit}`, {
          contentLength: response.message.length,
          tokensUsed: response.tokensUsed,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await this.logError('content_draft', `Failed to generate ${toolkit} content: ${errorMsg}`);
        // Fallback to placeholder
        drafts[toolkit] = `Failed to generate ${toolkit} content. Error: ${errorMsg}`;
      }
    }

    return drafts;
  }

  /**
   * Analyze generated content for engagement potential
   */
  private async _analyzeContent(drafts: Record<string, string>): Promise<string> {
    const contentSummary = Object.entries(drafts)
      .map(([platform, content]) => `${platform}: ${content.substring(0, 100)}...`)
      .join('\n');

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a social media strategist. Analyze the following content drafts and provide a brief analysis of their engagement potential and suggestions for improvement.`,
      },
      {
        role: 'user',
        content: `Analyze this content for engagement potential:\n\n${contentSummary}`,
      },
    ];

    try {
      const response = await this.mistral.chat(messages, {
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.message;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return `Analysis failed: ${errorMsg}`;
    }
  }

  /**
   * Build platform-specific content prompt
   */
  private _buildContentPrompt(
    brief: string,
    toolkit: string,
    tone: string,
    context?: string
  ): string {
    const platformGuide = {
      twitter: `Create a tweet (280 characters max) that is engaging and shareable. Use relevant hashtags if appropriate.`,
      reddit: `Create a Reddit post (title + body). Keep it authentic and community-focused. Include discussion hooks to encourage comments.`,
      linkedin: `Create a LinkedIn post that is professional but personable. Include relevant insights or lessons learned.`,
    };

    const guide = platformGuide[toolkit as keyof typeof platformGuide] || platformGuide.twitter;

    return `
Topic/Brief: ${brief}
Tone: ${tone}
${context ? `Additional Context: ${context}` : ''}

${guide}

Generate the content now:`;
  }

  /**
   * Get system prompt for the specific platform
   */
  private _getSystemPrompt(toolkit: string): string {
    const prompts = {
      twitter:
        'You are an expert social media copywriter specializing in creating viral Twitter content. Focus on engagement, clarity, and authenticity.',
      reddit: 'You are an expert Reddit content creator. You understand community dynamics and create content that sparks genuine discussions. Be authentic and community-focused.',
      linkedin: 'You are a professional content strategist specializing in LinkedIn. Create thoughtful, insightful posts that resonate with professionals.',
    };

    return prompts[toolkit as keyof typeof prompts] || prompts.twitter;
  }

  /**
   * Estimate tokens used for logging
   */
  private async _estimateTokens(brief: string, drafts: Record<string, string>): Promise<number> {
    // Rough estimation: ~1 token per 4 characters
    const totalChars = brief.length + Object.values(drafts).reduce((sum, d) => sum + d.length, 0);
    return Math.ceil(totalChars / 4);
  }

  /**
   * Execute action as per NexaBase interface
   */
  async executeAction(action: string, params: Record<string, any>): Promise<any> {
    if (action === 'generate_content') {
      return this.generateContent(params as ContentGenerationRequest);
    }
    throw new Error(`Unknown action: ${action}`);
  }

  /**
   * Get tool schemas for LangGraph (for future tool calling)
   */
  getToolSchemas(): AgentToolSchema[] {
    return [
      {
        type: 'function',
        function: {
          name: 'generate_content',
          description: 'Generate social media content for specified platforms',
          parameters: {
            type: 'object',
            properties: {
              brief: {
                type: 'string',
                description: 'The content brief or topic',
              },
              toolkits: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of platforms: twitter, reddit, linkedin',
              },
              tone: {
                type: 'string',
                enum: ['professional', 'casual', 'humorous'],
                description: 'Tone of content',
              },
              context: {
                type: 'string',
                description: 'Additional context or constraints',
              },
            },
            required: ['brief', 'toolkits'],
          },
        },
      },
    ];
  }
}

// Export singleton
let contentAgentInstance: ContentAgent | null = null;

export function getContentAgent(userId: string): ContentAgent {
  // For now, create new instance per request (can be optimized with caching)
  return new ContentAgent(userId);
}
