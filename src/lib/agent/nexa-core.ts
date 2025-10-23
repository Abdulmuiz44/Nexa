import { OpenAIClient } from '../ai/openai-client';
import { GeminiClient } from '../ai/gemini-client';
import { SupabaseAdapter } from '../db/supabase-adapter';

export type AIModel = 'openai' | 'gemini';
export type Platform = 'twitter' | 'reddit';
export type Tone = 'casual' | 'professional' | 'educational' | 'promotional';

export interface ConversationContext {
  userId: string;
  conversationId: string;
  lastMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userProfile?: {
    connectedPlatforms: Platform[];
    plan: 'free' | 'pro' | 'enterprise';
    totalPosts: number;
  };
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface NexaResponse {
  message: string;
  actions: ToolCall[];
  metadata: {
    modelUsed: AIModel;
    tokensUsed?: number;
    confidence?: number;
    suggestedActions?: string[];
  };
}

export interface ContentGenerationParams {
  topic: string;
  platform: Platform;
  tone: Tone;
  variations?: number;
  maxLength?: number;
  includeHashtags?: boolean;
  targetSubreddit?: string;
}

export interface PostSchedulingParams {
  content: string;
  platform: Platform;
  scheduledTime?: Date;
  campaignId?: string;
}

export interface CampaignCreationParams {
  name: string;
  topic: string;
  platforms: Platform[];
  durationDays: number;
  postsPerDay: number;
  startDate?: Date;
}

export class NexaAgentCore {
  private openai: OpenAIClient;
  private gemini: GeminiClient;
  private db: SupabaseAdapter;
  private maxRetries = 3;

  constructor() {
    this.openai = new OpenAIClient();
    this.gemini = new GeminiClient();
    this.db = new SupabaseAdapter();
  }

  /**
   * Process a user message and return a response with actions
   */
  async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<NexaResponse> {
    try {
      // Get conversation history for context
      const history = await this.getConversationHistory(context.conversationId);

      // Build the prompt with context
      const prompt = this.buildPrompt(message, context, history);

      // Try OpenAI first, fallback to Gemini
      let response: NexaResponse;
      try {
        response = await this.callAI(prompt, 'openai');
      } catch (error) {
        console.warn('OpenAI failed, falling back to Gemini:', error);
        response = await this.callAI(prompt, 'gemini');
      }

      // Parse and validate the response
      const parsedResponse = this.parseAndValidateResponse(response);

      // Store the conversation
      await this.storeConversation(context.conversationId, message, parsedResponse);

      return parsedResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        actions: [],
        metadata: {
          modelUsed: 'openai',
          confidence: 0
        }
      };
    }
  }

  /**
   * Execute a tool/action
   */
  async executeTool(toolCall: ToolCall, userId: string): Promise<any> {
    try {
      switch (toolCall.name) {
        case 'generate_content':
          return await this.generateContent(toolCall.parameters, userId);
        case 'schedule_post':
          return await this.schedulePost(toolCall.parameters, userId);
        case 'post_now':
          return await this.postNow(toolCall.parameters, userId);
        case 'create_campaign':
          return await this.createCampaign(toolCall.parameters, userId);
        case 'get_analytics':
          return await this.getAnalytics(toolCall.parameters, userId);
        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }
    } catch (error) {
      console.error(`Error executing tool ${toolCall.name}:`, error);
      throw error;
    }
  }

  private async generateContent(
    params: ContentGenerationParams,
    userId: string
  ): Promise<any> {
    const { topic, platform, tone, variations = 3 } = params;

    // Platform-specific rules
    const maxLength = platform === 'twitter' ? 280 : 2000;
    const contentPrompt = this.buildContentPrompt(params);

    try {
      const contents = [];
      for (let i = 0; i < variations; i++) {
        const variationPrompt = `${contentPrompt}\n\nVariation ${i + 1}:`;
        const content = await this.callAI(variationPrompt, 'openai', true);

        // Post-process for platform rules
        const processedContent = this.postProcessContent(content.message, platform, params);

        contents.push({
          content: processedContent,
          platform,
          tone,
          variation: i + 1
        });
      }

      // Store in database as drafts
      const postIds = [];
      for (const content of contents) {
        const postId = await this.db.createPost({
          userId,
          content: content.content,
          platform,
          status: 'draft',
          metadata: {
            generated: true,
            topic,
            tone,
            variation: content.variation
          }
        });
        postIds.push(postId);
      }

      return {
        contents,
        postIds,
        message: `Generated ${variations} content variations for ${platform} about "${topic}"`
      };
    } catch (error) {
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  private async schedulePost(
    params: PostSchedulingParams,
    userId: string
  ): Promise<any> {
    const { content, platform, scheduledTime, campaignId } = params;

    // Validate user has connected the platform
    const connected = await this.db.checkPlatformConnection(userId, platform);
    if (!connected) {
      throw new Error(`Please connect your ${platform} account first`);
    }

    // Schedule the post
    const postId = await this.db.createPost({
      userId,
      content,
      platform,
      status: 'scheduled',
      scheduledAt: scheduledTime,
      campaignId,
      metadata: {
        scheduled: true
      }
    });

    // Add to job queue
    await this.schedulePostingJob(postId, scheduledTime || new Date());

    return {
      postId,
      scheduledTime,
      message: `Post scheduled for ${platform} at ${scheduledTime?.toLocaleString() || 'now'}`
    };
  }

  private async postNow(
    params: PostSchedulingParams,
    userId: string
  ): Promise<any> {
    const { content, platform, campaignId } = params;

    // Validate connection
    const connected = await this.db.checkPlatformConnection(userId, platform);
    if (!connected) {
      throw new Error(`Please connect your ${platform} account first`);
    }

    // Create post record
    const postId = await this.db.createPost({
      userId,
      content,
      platform,
      status: 'published',
      publishedAt: new Date(),
      campaignId,
      metadata: {
        postedImmediately: true
      }
    });

    // Post immediately
    try {
      const result = await this.postToPlatform(postId, platform, content, userId);
      return {
        postId,
        platformPostId: result.platformPostId,
        platformPostUrl: result.platformPostUrl,
        message: `Posted to ${platform} successfully!`
      };
    } catch (error) {
      // Update status to failed
      await this.db.updatePostStatus(postId, 'failed');
      throw error;
    }
  }

  private async createCampaign(
    params: CampaignCreationParams,
    userId: string
  ): Promise<any> {
    const { name, topic, platforms, durationDays, postsPerDay, startDate } = params;

    // Validate connections
    for (const platform of platforms) {
      const connected = await this.db.checkPlatformConnection(userId, platform);
      if (!connected) {
        throw new Error(`Please connect your ${platform} account first`);
      }
    }

    // Create campaign
    const campaignId = await this.db.createCampaign({
      userId,
      name,
      platforms,
      durationDays,
      postsPerDay,
      topic,
      status: 'active',
      startDate: startDate || new Date(),
      metadata: {
        totalPosts: durationDays * postsPerDay
      }
    });

    // Generate and schedule posts
    const posts = [];
    const startTime = startDate || new Date();

    for (let day = 0; day < durationDays; day++) {
      for (let post = 0; post < postsPerDay; post++) {
        const scheduledTime = new Date(startTime);
        scheduledTime.setDate(scheduledTime.getDate() + day);
        scheduledTime.setHours(9 + (post * 4), 0, 0, 0); // 9am, 1pm, 5pm, etc.

        // Generate content for this post
        const contentParams: ContentGenerationParams = {
          topic,
          platform: platforms[post % platforms.length], // Rotate platforms
          tone: ['casual', 'professional', 'educational'][post % 3] as Tone,
          variations: 1
        };

        const generated = await this.generateContent(contentParams, userId);
        const content = generated.contents[0].content;

        // Schedule the post
        const postId = await this.schedulePost({
          content,
          platform: contentParams.platform,
          scheduledTime,
          campaignId
        }, userId);

        posts.push({
          postId,
          scheduledTime,
          platform: contentParams.platform,
          content
        });
      }
    }

    return {
      campaignId,
      totalPosts: posts.length,
      posts,
      message: `Created campaign "${name}" with ${posts.length} posts over ${durationDays} days`
    };
  }

  private async getAnalytics(params: any, userId: string): Promise<any> {
    const { days = 7, platform } = params;

    const analytics = await this.db.getUserAnalytics(userId, days, platform);

    const summary = {
      totalImpressions: analytics.reduce((sum, a) => sum + a.impressions, 0),
      totalEngagements: analytics.reduce((sum, a) => sum + a.engagements, 0),
      totalPosts: analytics.length,
      avgEngagementRate: analytics.length > 0 ?
        analytics.reduce((sum, a) => sum + a.engagement_rate, 0) / analytics.length : 0
    };

    return {
      analytics,
      summary,
      message: `Analytics for the last ${days} days: ${summary.totalImpressions} impressions, ${summary.totalEngagements} engagements`
    };
  }

  private async callAI(
    prompt: string,
    model: AIModel,
    isContentGeneration = false
  ): Promise<NexaResponse> {
    const client = model === 'openai' ? this.openai : this.gemini;

    const systemPrompt = isContentGeneration ?
      'You are a social media content expert. Generate engaging content based on the user\'s request.' :
      `You are Nexa, an AI growth agent that helps users promote their AI tools on Twitter and Reddit.

You can perform these actions:
- generate_content: Create social media posts
- schedule_post: Schedule posts for later
- post_now: Post immediately
- create_campaign: Set up multi-post campaigns
- get_analytics: Show engagement metrics

Always respond with a helpful message and optionally suggest actions using the tool format.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const response = await client.chat(messages);

    return {
      message: response.message,
      actions: this.parseActions(response.message),
      metadata: {
        modelUsed: model,
        tokensUsed: response.tokensUsed,
        confidence: 0.9
      }
    };
  }

  private parseActions(message: string): ToolCall[] {
    // Simple action parsing - look for action mentions
    const actions: ToolCall[] = [];

    if (message.toLowerCase().includes('generate content')) {
      actions.push({
        name: 'generate_content',
        parameters: { topic: 'extracted from message' }
      });
    }

    // More sophisticated parsing would be implemented here
    return actions;
  }

  private buildPrompt(message: string, context: ConversationContext, history: any[]): string {
    const contextStr = `
User Context:
- Platforms connected: ${context.userProfile?.connectedPlatforms.join(', ') || 'none'}
- Plan: ${context.userProfile?.plan || 'free'}
- Total posts: ${context.userProfile?.totalPosts || 0}

Recent conversation:
${history.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')}

Current message: ${message}

Respond as Nexa, the AI growth agent. Be helpful, suggest actions when appropriate.`;

    return contextStr;
  }

  private buildContentPrompt(params: ContentGenerationParams): string {
    const { topic, platform, tone, maxLength, includeHashtags, targetSubreddit } = params;

    let prompt = `Generate a ${tone} ${platform} post about: ${topic}

Requirements:
- Tone: ${tone}
- Platform: ${platform}
- Max length: ${maxLength || (platform === 'twitter' ? 280 : 2000)} characters`;

    if (includeHashtags && platform === 'twitter') {
      prompt += '\n- Include relevant hashtags';
    }

    if (targetSubreddit && platform === 'reddit') {
      prompt += `\n- Optimized for r/${targetSubreddit}`;
    }

    prompt += '\n\nMake it engaging and likely to get good engagement.';

    return prompt;
  }

  private postProcessContent(content: string, platform: Platform, params: ContentGenerationParams): string {
    let processed = content;

    // Twitter-specific processing
    if (platform === 'twitter') {
      // Truncate if too long
      if (processed.length > 280) {
        processed = processed.substring(0, 277) + '...';
      }

      // Add hashtags if requested
      if (params.includeHashtags) {
        const hashtags = this.generateHashtags(params.topic);
        processed += '\n\n' + hashtags.join(' ');
      }
    }

    // Reddit-specific processing
    if (platform === 'reddit') {
      // Ensure it's not too promotional
      if (processed.length > 2000) {
        processed = processed.substring(0, 1997) + '...';
      }
    }

    return processed;
  }

  private generateHashtags(topic: string): string[] {
    // Simple hashtag generation based on topic
    const baseHashtags = ['#AI', '#Tech'];

    if (topic.toLowerCase().includes('chatbot')) {
      baseHashtags.push('#ChatGPT', '#AIChat');
    }
    if (topic.toLowerCase().includes('automation')) {
      baseHashtags.push('#Automation', '#Productivity');
    }

    return baseHashtags.slice(0, 3); // Max 3 hashtags
  }

  private async schedulePostingJob(postId: string, scheduledTime: Date): Promise<void> {
    // This would integrate with BullMQ
    // For now, just log
    console.log(`Scheduling post ${postId} for ${scheduledTime}`);
  }

  private async postToPlatform(
    postId: string,
    platform: Platform,
    content: string,
    userId: string
  ): Promise<{ platformPostId: string; platformPostUrl: string }> {
    // This would call the platform APIs
    // For now, mock response
    return {
      platformPostId: `mock_${platform}_${Date.now()}`,
      platformPostUrl: `https://${platform}.com/post/mock_${Date.now()}`
    };
  }

  private parseAndValidateResponse(response: NexaResponse): NexaResponse {
    // Validate and clean up the response
    return {
      ...response,
      actions: response.actions.filter(action =>
        ['generate_content', 'schedule_post', 'post_now', 'create_campaign', 'get_analytics'].includes(action.name)
      )
    };
  }

  private async getConversationHistory(conversationId: string): Promise<any[]> {
    return await this.db.getConversationMessages(conversationId, 10);
  }

  private async storeConversation(
    conversationId: string,
    userMessage: string,
    response: NexaResponse
  ): Promise<void> {
    await this.db.addMessage(conversationId, 'user', userMessage);
    await this.db.addMessage(conversationId, 'assistant', response.message, {
      actions: response.actions,
      modelUsed: response.metadata.modelUsed,
      tokensUsed: response.metadata.tokensUsed
    });
  }
}
