import { ComposioIntegrationService } from './composioIntegration';
import { EngagementSuiteService } from '@/src/lib/services/engagementSuiteService';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { callUserLLM } from '@/src/lib/ai/user-provider';
import { recordAIUsage } from '@/lib/utils/credits';

interface AutonomousAgentConfig {
  userId: string;
  platforms: ('twitter' | 'reddit')[];
  autoPostEnabled: boolean;
  autoEngageEnabled: boolean;
  postingFrequency: 'hourly' | 'daily' | 'twice_daily' | 'custom';
  customSchedule?: string[]; // e.g., ['09:00', '15:00', '21:00']
  engagementRules: {
    autoLike: boolean;
    autoRetweet: boolean;
    autoReply: boolean;
    minEngagementScore: number; // 0-100, threshold for auto-engagement
  };
  contentTopics: string[];
  targetAudience: string;
}

interface EngagementOpportunity {
  tweetId: string;
  content: string;
  author: string;
  relevanceScore: number;
  suggestedEngagement: 'like' | 'retweet' | 'reply';
  suggestedReply?: string;
}

export class AutonomousAgent {
  private config: AutonomousAgentConfig;
  private composioService: ComposioIntegrationService;
  private isRunning: boolean = false;

  constructor(config: AutonomousAgentConfig) {
    this.config = config;
    this.composioService = new ComposioIntegrationService(config.userId);
  }

  /**
   * Start the autonomous agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Agent already running');
      return;
    }

    this.isRunning = true;
    await this.logActivity('agent_started', 'Autonomous agent started');

    // Start monitoring and engagement loop
    this.runEngagementLoop();

    // Start content generation and posting loop
    if (this.config.autoPostEnabled) {
      this.runPostingLoop();
    }
  }

  /**
   * Stop the autonomous agent
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    await this.logActivity('agent_stopped', 'Autonomous agent stopped');
  }

  /**
   * Main engagement loop - monitors and engages with relevant content
   */
  private async runEngagementLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        if (this.config.autoEngageEnabled && this.config.platforms.includes('twitter')) {
          await this.performAutoEngagement();
        }

        // Wait before next check (e.g., every 10 minutes)
        await this.sleep(10 * 60 * 1000);
      } catch (error) {
        console.error('Error in engagement loop:', error);
        await this.sleep(60 * 1000); // Wait 1 minute on error
      }
    }
  }

  /**
   * Main posting loop - generates and posts content according to schedule
   */
  private async runPostingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const shouldPost = await this.shouldPostNow();

        if (shouldPost) {
          await this.generateAndPost();
        }

        // Check every hour
        await this.sleep(60 * 60 * 1000);
      } catch (error) {
        console.error('Error in posting loop:', error);
        await this.sleep(60 * 1000);
      }
    }
  }

  /**
   * Determine if we should post now based on schedule
   */
  private async shouldPostNow(): Promise<boolean> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if we already posted in the last hour
    const recentPosts = await this.getRecentPosts(1);
    if (recentPosts.length > 0) {
      const lastPost = new Date(recentPosts[0].created_at);
      const hoursSinceLastPost = (now.getTime() - lastPost.getTime()) / (1000 * 60 * 60);

      switch (this.config.postingFrequency) {
        case 'hourly':
          if (hoursSinceLastPost < 1) return false;
          break;
        case 'daily':
          if (hoursSinceLastPost < 24) return false;
          break;
        case 'twice_daily':
          if (hoursSinceLastPost < 12) return false;
          break;
        case 'custom':
          // Check against custom schedule
          if (!this.config.customSchedule) return false;
          const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          const isScheduledTime = this.config.customSchedule.some(time => {
            const [hour, minute] = time.split(':');
            return Math.abs(parseInt(hour) - currentHour) === 0 && Math.abs(parseInt(minute) - currentMinute) < 30;
          });
          return isScheduledTime;
      }
    }

    return true;
  }

  /**
   * Generate and post content
   */
  private async generateAndPost(): Promise<void> {
    try {
      // Randomly select a platform
      const platform = this.config.platforms[Math.floor(Math.random() * this.config.platforms.length)];

      if (platform === 'twitter') {
        await this.generateAndPostTweet();
      } else if (platform === 'reddit') {
        await this.generateAndPostReddit();
      }
    } catch (error) {
      console.error('Error generating and posting:', error);
      await this.logActivity('post_generation_failed', `Failed to generate and post: ${error}`);
    }
  }

  /**
   * Generate and post a tweet
   */
  private async generateAndPostTweet(): Promise<void> {
    try {
      // Select a random topic
      const topic = this.config.contentTopics[Math.floor(Math.random() * this.config.contentTopics.length)];

      // Generate tweet in user's style
      const tweetContent = await this.composioService.generateTweetInUserStyle(
        topic,
        `Target audience: ${this.config.targetAudience}`
      );

      // Post the tweet
      const result = await this.composioService.postTweet({ content: tweetContent });

      if (result.success) {
        // Save to database
        await this.savePost('twitter', tweetContent, result.tweetId, result.url);
        await this.logActivity('auto_tweet_posted', `Auto-posted tweet: ${tweetContent.substring(0, 50)}...`);
      } else {
        throw new Error(result.error || 'Failed to post tweet');
      }
    } catch (error) {
      console.error('Error generating and posting tweet:', error);
      throw error;
    }
  }

  /**
   * Generate and post to Reddit
   */
  private async generateAndPostReddit(): Promise<void> {
    try {
      // Generate Reddit post content
      const topic = this.config.contentTopics[Math.floor(Math.random() * this.config.contentTopics.length)];

      const prompt = `Generate a Reddit post about "${topic}" for the audience: ${this.config.targetAudience}. 
      
      Provide a JSON response with:
      {
        "title": "engaging title",
        "content": "detailed post content",
        "subreddit": "suggested subreddit name (without r/)"
      }`;

      const response = await this.callAutonomousLLM(
        [
          {
            role: 'system',
            content: 'You are an expert at creating engaging Reddit posts. Generate content that fits the platform culture.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        { temperature: 0.7, max_tokens: 400 },
        'autonomous_reddit'
      );

      const postData = JSON.parse(response.message || '{}');

      // Post to Reddit
      const result = await this.composioService.postToReddit({
        subreddit: postData.subreddit,
        title: postData.title,
        content: postData.content,
      });

      if (result.success) {
        await this.savePost('reddit', postData.content, result.postId, result.url);
        await this.logActivity('auto_reddit_post', `Auto-posted to r/${postData.subreddit}: ${postData.title}`);
      } else {
        throw new Error(result.error || 'Failed to post to Reddit');
      }
    } catch (error) {
      console.error('Error generating and posting to Reddit:', error);
      throw error;
    }
  }

  /**
   * Perform automatic engagement with relevant content
   */
  private async performAutoEngagement(): Promise<void> {
    try {
      // Find engagement opportunities
      const opportunities = await this.findEngagementOpportunities();

      for (const opportunity of opportunities) {
        if (opportunity.relevanceScore < this.config.engagementRules.minEngagementScore) {
          continue;
        }

        // Use EngagementSuiteService to execute the engagement
        const result = await EngagementSuiteService.engageWithOpportunity(
          opportunity.tweetId, // This is now the opportunity ID from the database
          this.config.userId,
          opportunity.suggestedEngagement
        );

        if (result.success) {
          await this.logActivity(
            `auto_${opportunity.suggestedEngagement}`,
            `${opportunity.suggestedEngagement === 'reply' ? 'Replied' : opportunity.suggestedEngagement === 'retweet' ? 'Retweeted' : 'Liked'} post from ${opportunity.author}`,
            { opportunityId: opportunity.tweetId, relevanceScore: opportunity.relevanceScore }
          );
        } else {
          console.error('Failed to engage with opportunity:', result.error);
        }

        // Rate limiting - wait between engagements
        await this.sleep(5000);
      }
    } catch (error) {
      console.error('Error performing auto-engagement:', error);
    }
  }

  private async callAutonomousLLM(
    messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_calls?: unknown[] }[],
    options?: { temperature?: number; max_tokens?: number },
    endpoint: string = 'autonomous_ai'
  ) {
    const aiResponse = await callUserLLM({
      userId: this.config.userId,
      payload: {
        model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
        messages,
        temperature: options?.temperature,
        max_tokens: options?.max_tokens,
      },
    });

    try {
      const usage = aiResponse.usage || {};
      const anyUsage = usage as any;
      const total = Number(anyUsage.total_tokens ?? anyUsage.totalTokens ?? 0);
      if (total > 0) {
        await recordAIUsage(this.config.userId, { total_tokens: total }, { model: aiResponse.model || process.env.MISTRAL_MODEL || 'mistral-large-latest', endpoint });
      }
    } catch (error) {
      console.error(`Autonomous LLM credit deduction (${endpoint}) error:`, error);
    }

    return aiResponse;
  }

  /**
   * Find engagement opportunities from user's feed
   */
  private async findEngagementOpportunities(): Promise<EngagementOpportunity[]> {
    try {
      // Use the EngagementSuiteService to find real opportunities
      // This saves them to the database and returns them with proper IDs
      const opportunities = await EngagementSuiteService.discoverEngagementOpportunities(
        this.config.userId,
        this.config.engagementRules.minEngagementScore,
        20 // Limit to 20 opportunities per check
      );

      // Convert to our internal format (keeping the opportunity ID for engagement)
      return opportunities.map(opp => ({
        tweetId: opp.id, // Use opportunity ID for engagement, not tweet ID
        content: opp.content,
        author: opp.author,
        relevanceScore: opp.relevance_score,
        suggestedEngagement: opp.suggested_action as 'like' | 'retweet' | 'reply',
        suggestedReply: opp.suggested_reply,
      }));
    } catch (error) {
      console.error('Error finding engagement opportunities:', error);
      return [];
    }
  }

  /**
   * Analyze a tweet to determine if and how to engage
   */
  private async analyzeTweetForEngagement(tweet: any): Promise<EngagementOpportunity> {
    const prompt = `Analyze this tweet and determine engagement strategy:

Tweet: "${tweet.text}"
Author: ${tweet.author}
Topics of interest: ${this.config.contentTopics.join(', ')}
Target audience: ${this.config.targetAudience}

Provide analysis in JSON format:
{
  "relevanceScore": 0-100,
  "suggestedEngagement": "like|retweet|reply",
  "suggestedReply": "reply text if engagement is reply, otherwise null",
  "reasoning": "why this engagement makes sense"
}`;

    const response = await this.callAutonomousLLM(
      [
        {
          role: 'system',
          content: 'You are an expert at social media engagement strategy. Determine optimal engagement approaches.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      { temperature: 0.3, max_tokens: 350 },
      'autonomous_engagement'
    );

    const analysis = JSON.parse(response.message || '{}');

    return {
      tweetId: tweet.id,
      content: tweet.text,
      author: tweet.author,
      relevanceScore: analysis.relevanceScore || 0,
      suggestedEngagement: analysis.suggestedEngagement || 'like',
      suggestedReply: analysis.suggestedReply,
    };
  }

  /**
   * Get recent posts
   */
  private async getRecentPosts(hours: number): Promise<any[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const { data } = await supabaseServer
      .from('posts')
      .select('*')
      .eq('user_id', this.config.userId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    return data || [];
  }

  /**
   * Save a post to database
   */
  private async savePost(
    platform: 'twitter' | 'reddit',
    content: string,
    platformPostId?: string,
    url?: string
  ): Promise<void> {
    await supabaseServer.from('posts').insert({
      user_id: this.config.userId,
      platform,
      content,
      platform_post_id: platformPostId,
      status: 'published',
      published_at: new Date().toISOString(),
      metadata: {
        generated_by: 'autonomous_agent',
        url,
      },
    });
  }

  /**
   * Log activity
   */
  private async logActivity(action: string, description: string, metadata: any = {}): Promise<void> {
    await supabaseServer.from('activity_log').insert({
      user_id: this.config.userId,
      action,
      description,
      metadata: {
        ...metadata,
        agent: 'autonomous_agent',
      },
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory to create and manage autonomous agents
 */
export class AutonomousAgentManager {
  private static agents: Map<string, AutonomousAgent> = new Map();

  static async createAgent(userId: string): Promise<AutonomousAgent> {
    // Check if agent already exists
    if (this.agents.has(userId)) {
      return this.agents.get(userId)!;
    }

    // Get user config from database
    const { data: user } = await supabaseServer
      .from('users')
      .select('onboarding_data')
      .eq('id', userId)
      .single();

    if (!user?.onboarding_data) {
      throw new Error('User onboarding data not found');
    }

    const onboarding = user.onboarding_data;

    const config: AutonomousAgentConfig = {
      userId,
      platforms: ['twitter', 'reddit'],
      autoPostEnabled: onboarding.auto_post_enabled ?? true,
      autoEngageEnabled: onboarding.auto_engage_enabled ?? true,
      postingFrequency: onboarding.posting_frequency || 'daily',
      customSchedule: onboarding.custom_schedule,
      engagementRules: {
        autoLike: onboarding.auto_like ?? true,
        autoRetweet: onboarding.auto_retweet ?? false,
        autoReply: onboarding.auto_reply ?? true,
        minEngagementScore: onboarding.min_engagement_score ?? 70,
      },
      contentTopics: onboarding.content_topics || onboarding.promotion_goals || [],
      targetAudience: onboarding.target_audience || 'general',
    };

    const agent = new AutonomousAgent(config);
    this.agents.set(userId, agent);

    return agent;
  }

  static async startAgent(userId: string): Promise<void> {
    const agent = await this.createAgent(userId);
    await agent.start();
  }

  static async stopAgent(userId: string): Promise<void> {
    const agent = this.agents.get(userId);
    if (agent) {
      await agent.stop();
      this.agents.delete(userId);
    }
  }

  static getAgent(userId: string): AutonomousAgent | undefined {
    return this.agents.get(userId);
  }
}
