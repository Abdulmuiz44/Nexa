import { SocialMediaService, Platform } from './socialMediaService';
import { EngagementSuiteService } from '@/src/lib/services/engagementSuiteService';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { callUserLLM } from '@/src/lib/ai/user-provider';
import { recordAIUsage } from '@/lib/utils/credits';

interface AutonomousAgentConfig {
  userId: string;
  platforms: Platform[];
  autoPostEnabled: boolean;
  autoEngageEnabled: boolean;
  postingFrequency: 'hourly' | 'daily' | 'twice_daily' | 'custom';
  customSchedule?: string[];
  engagementRules: {
    autoLike: boolean;
    autoRetweet: boolean;
    autoReply: boolean;
    minEngagementScore: number;
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
  private socialMediaService: SocialMediaService;
  private isRunning: boolean = false;

  constructor(config: AutonomousAgentConfig) {
    this.config = config;
    this.socialMediaService = new SocialMediaService(config.userId);
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.logActivity('agent_started', 'Autonomous agent started');
    this.runEngagementLoop();
    if (this.config.autoPostEnabled) this.runPostingLoop();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    await this.logActivity('agent_stopped', 'Autonomous agent stopped');
  }

  private async runEngagementLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        if (this.config.autoEngageEnabled && this.config.platforms.includes('twitter')) {
          await this.performAutoEngagement();
        }
        await this.sleep(10 * 60 * 1000);
      } catch (error) {
        console.error('Error in engagement loop:', error);
        await this.sleep(60 * 1000);
      }
    }
  }

  private async runPostingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        if (await this.shouldPostNow()) await this.generateAndPost();
        await this.sleep(60 * 60 * 1000);
      } catch (error) {
        console.error('Error in posting loop:', error);
        await this.sleep(60 * 1000);
      }
    }
  }

  private async shouldPostNow(): Promise<boolean> {
    const now = new Date();
    const recentPosts = await this.getRecentPosts(1);
    if (recentPosts.length === 0) return true;

    const lastPost = new Date(recentPosts[0].created_at);
    const hoursSince = (now.getTime() - lastPost.getTime()) / (1000 * 60 * 60);

    switch (this.config.postingFrequency) {
      case 'hourly': return hoursSince >= 1;
      case 'daily': return hoursSince >= 24;
      case 'twice_daily': return hoursSince >= 12;
      case 'custom':
        if (!this.config.customSchedule) return false;
        return this.config.customSchedule.some(time => {
          const [h, m] = time.split(':').map(Number);
          return now.getHours() === h && Math.abs(now.getMinutes() - m) < 30;
        });
      default: return true;
    }
  }

  private async generateAndPost(): Promise<void> {
    const platform = this.config.platforms[Math.floor(Math.random() * this.config.platforms.length)];
    if (platform === 'twitter') await this.generateAndPostTweet();
    else if (platform === 'reddit') await this.generateAndPostReddit();
  }

  private async generateAndPostTweet(): Promise<void> {
    const topic = this.config.contentTopics[Math.floor(Math.random() * this.config.contentTopics.length)];
    const prompt = `Generate a tweet about "${topic}" for ${this.config.targetAudience}. Max 280 chars.`;

    const response = await this.callAutonomousLLM([
      { role: 'system', content: 'You are a social media expert. Generate engaging tweets.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, max_tokens: 100 }, 'auto_tweet');

    const tweetContent = response.message || '';
    const result = await this.socialMediaService.post('twitter', tweetContent);

    if (result.success) {
      await this.savePost('twitter', tweetContent, result.platformPostId, result.platformPostUrl);
      await this.logActivity('auto_tweet_posted', `Posted: ${tweetContent.substring(0, 50)}...`);
    }
  }

  private async generateAndPostReddit(): Promise<void> {
    const topic = this.config.contentTopics[Math.floor(Math.random() * this.config.contentTopics.length)];
    const prompt = `Generate a Reddit post JSON for "${topic}". Format: {"title":"...", "content":"...", "subreddit":"..."}`;

    const response = await this.callAutonomousLLM([
      { role: 'system', content: 'You create Reddit posts. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.7, max_tokens: 400 }, 'auto_reddit');

    try {
      const data = JSON.parse(response.message || '{}');
      // Note: Current SocialMediaService.post doesn't support subreddit param directly.
      // This would need further extension or use of postToPlatform directly with subreddit.
      const result = await this.socialMediaService.post('reddit', data.content);
      if (result.success) {
        await this.savePost('reddit', data.content, result.platformPostId, result.platformPostUrl);
        await this.logActivity('auto_reddit_post', `Posted: ${data.title}`);
      }
    } catch (e) {
      console.error('Failed to parse Reddit post JSON:', e);
    }
  }

  private async performAutoEngagement(): Promise<void> {
    try {
      const opportunities = await EngagementSuiteService.discoverEngagementOpportunities(
        this.config.userId,
        this.config.engagementRules.minEngagementScore,
        20
      );

      for (const opp of opportunities) {
        if (opp.relevance_score < this.config.engagementRules.minEngagementScore) continue;

        await EngagementSuiteService.engageWithOpportunity(
          opp.id,
          this.config.userId,
          opp.suggested_action
        );
        await this.sleep(5000);
      }
    } catch (error) {
      console.error('Error in auto-engagement:', error);
    }
  }

  private async callAutonomousLLM(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options: { temperature?: number; max_tokens?: number },
    endpoint: string
  ) {
    const response = await callUserLLM({
      userId: this.config.userId,
      payload: {
        model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
        messages,
        ...options
      }
    });
    try {
      const total = (response.usage as any)?.total_tokens || 0;
      if (total > 0) await recordAIUsage(this.config.userId, { total_tokens: total }, { model: response.model, endpoint });
    } catch { }
    return response;
  }

  private async getRecentPosts(hours: number): Promise<any[]> {
    const { data } = await supabaseServer.from('posts').select('*')
      .eq('user_id', this.config.userId)
      .gte('created_at', new Date(Date.now() - hours * 3600000).toISOString())
      .order('created_at', { ascending: false });
    return data || [];
  }

  private async savePost(platform: Platform, content: string, postId?: string, url?: string) {
    await supabaseServer.from('posts').insert({
      user_id: this.config.userId, platform, content,
      platform_post_id: postId, platform_post_url: url,
      status: 'published', published_at: new Date().toISOString(),
      metadata: { generated_by: 'autonomous_agent' }
    });
  }

  private async logActivity(action: string, description: string, metadata: any = {}) {
    await supabaseServer.from('activity_log').insert({
      user_id: this.config.userId, action, description,
      metadata: { ...metadata, agent: 'autonomous_agent' }
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

export class AutonomousAgentManager {
  private static agents: Map<string, AutonomousAgent> = new Map();

  static async createAgent(userId: string): Promise<AutonomousAgent> {
    if (this.agents.has(userId)) return this.agents.get(userId)!;

    const { data: user } = await supabaseServer.from('users').select('onboarding_data').eq('id', userId).single();
    if (!user?.onboarding_data) throw new Error('User onboarding data not found');

    const o = user.onboarding_data;
    const config: AutonomousAgentConfig = {
      userId,
      platforms: ['twitter', 'reddit'],
      autoPostEnabled: o.auto_post_enabled ?? true,
      autoEngageEnabled: o.auto_engage_enabled ?? true,
      postingFrequency: o.posting_frequency || 'daily',
      customSchedule: o.custom_schedule,
      engagementRules: {
        autoLike: o.auto_like ?? true, autoRetweet: o.auto_retweet ?? false,
        autoReply: o.auto_reply ?? true, minEngagementScore: o.min_engagement_score ?? 70
      },
      contentTopics: o.content_topics || o.promotion_goals || [],
      targetAudience: o.target_audience || 'general'
    };

    const agent = new AutonomousAgent(config);
    this.agents.set(userId, agent);
    return agent;
  }

  static async startAgent(userId: string): Promise<void> {
    (await this.createAgent(userId)).start();
  }

  static async stopAgent(userId: string): Promise<void> {
    this.agents.get(userId)?.stop();
    this.agents.delete(userId);
  }

  static getAgent(userId: string) { return this.agents.get(userId); }
}
