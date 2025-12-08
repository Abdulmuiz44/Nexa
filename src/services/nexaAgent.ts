import { contentGenerator, ContentRequest, GeneratedContent } from './contentGenerator';
import { composio } from '@/lib/composio';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { Queue } from 'bullmq';

interface AgentConfig {
  userId: string;
  goals: string[];
  postingFrequency: 'daily' | 'weekly' | 'custom';
  platforms: ('twitter' | 'reddit')[];
  brandVoice: string;
  businessInfo: {
    name: string;
    type: string;
    website?: string;
  };
}

interface PostRequest {
  platform: 'twitter' | 'reddit';
  topic?: string;
  scheduledTime?: Date;
  campaignId?: string;
}

export class NexaAgent {
  private userId: string;
  private config: AgentConfig;
  private postQueue: Queue;

  constructor(userId: string, config: AgentConfig) {
    this.userId = userId;
    this.config = config;

    this.postQueue = new Queue('postScheduler', {
      connection: {
        host: process.env.REDIS_URL || 'localhost',
        port: 6379,
      },
    });
  }

  async startAgent(): Promise<{ success: boolean; message: string }> {
    try {
      // Validate connections
      const connections = await this.getActiveConnections();
      if (connections.length === 0) {
        return {
          success: false,
          message: 'No social media connections found. Please connect your accounts first.'
        };
      }

      // Update user status
      await supabaseServer
        .from('users')
        .update({ status: 'agent_active' })
        .eq('id', this.userId);

      // Log agent start
      await this.logActivity('agent_started', 'AI Growth Agent activated');

      return {
        success: true,
        message: 'Nexa AI Agent started successfully!'
      };
    } catch (error) {
      console.error('Error starting agent:', error);
      return {
        success: false,
        message: 'Failed to start agent. Please try again.'
      };
    }
  }

  async generateAndSchedulePost(request: PostRequest): Promise<{ success: boolean; post?: any; scheduled?: boolean }> {
    try {
      // Check if platform is connected
      const connection = await this.getConnectionForPlatform(request.platform);
      if (!connection) {
        throw new Error(`No ${request.platform} connection found`);
      }

      // Generate content using OpenAI
      const contentRequest: ContentRequest = {
        platform: request.platform,
        topic: request.topic,
        campaignId: request.campaignId,
        userProfile: {
          businessName: this.config.businessInfo.name,
          businessType: this.config.businessInfo.type,
          websiteUrl: this.config.businessInfo.website,
          promotionGoals: this.config.goals,
          postingFrequency: this.config.postingFrequency,
          brandTone: this.config.brandVoice,
        }
      };

      const generatedContent = await contentGenerator.generateContent(this.userId, contentRequest);

      if (request.scheduledTime) {
        // Schedule for later
        const scheduledPost = await this.schedulePost(generatedContent, connection.id, request.scheduledTime, request.campaignId);
        return { success: true, post: scheduledPost, scheduled: true };
      } else {
        // Post immediately
        const postedContent = await this.postImmediately(generatedContent, connection.id, request.campaignId);
        return { success: true, post: postedContent };
      }
    } catch (error) {
      console.error('Error generating/scheduling post:', error);
      const message = error instanceof Error ? error.message : String(error);
      await this.logActivity('post_generation_failed', `Failed to create post: ${message}`);
      return { success: false };
    }
  }

  async generateContentSeries(count: number, platform: 'twitter' | 'reddit', topic?: string): Promise<GeneratedContent[]> {
    const contentRequest: ContentRequest = {
      platform,
      topic,
      userProfile: {
        businessName: this.config.businessInfo.name,
        businessType: this.config.businessInfo.type,
        websiteUrl: this.config.businessInfo.website,
        promotionGoals: this.config.goals,
        postingFrequency: this.config.postingFrequency,
        brandTone: this.config.brandVoice,
      }
    };

    return await contentGenerator.generateContentSeries(this.userId, { ...contentRequest, count });
  }

  private async getActiveConnections() {
    const { data } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('user_id', this.userId);

    return data || [];
  }

  private async getConnectionForPlatform(platform: string) {
    const connections = await this.getActiveConnections();
    return connections.find(conn => conn.toolkit_slug.includes(platform));
  }

  private async schedulePost(content: GeneratedContent, connectionId: string, scheduledTime: Date, campaignId?: string) {
    const { data: post, error } = await supabaseServer
      .from('posts')
      .insert({
        user_id: this.userId,
        campaign_id: campaignId,
        composio_connection_id: connectionId,
        platform: content.platform as any,
        content: content.content,
        status: 'scheduled',
        scheduled_at: scheduledTime,
        metadata: {
          generatedBy: 'nexa_agent',
          confidence: content.confidence,
          hashtags: content.hashtags,
          callToAction: content.callToAction,
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Add to queue
    await this.postQueue.add(
      'schedulePost',
      { postId: post.id },
      {
        delay: scheduledTime.getTime() - Date.now(),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );

    await this.logActivity('post_scheduled', `Post scheduled for ${scheduledTime.toISOString()} on ${content.platform}`);
    return post;
  }

  private async postImmediately(content: GeneratedContent, connectionId: string, campaignId?: string) {
    const connection = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection.data) throw new Error('Connection not found');

    try {
      // Post via Composio
      const composioClient = composio as any;
      if (!composioClient) {
        throw new Error('Composio is not configured');
      }

      const result = await composioClient.tools.execute({
        connectionId: connection.data.composio_connection_id,
        appName: connection.data.toolkit_slug,
        actionName: content.platform === 'twitter' ? 'create_tweet' : 'submit_post',
        input: {
          content: content.content,
          // Add platform-specific params
        },
      });

      // Save to database
      const { data: post, error } = await supabaseServer
        .from('posts')
        .insert({
          user_id: this.userId,
          campaign_id: campaignId,
          composio_connection_id: connectionId,
          platform: content.platform as any,
          content: content.content,
          status: 'published',
          published_at: new Date(),
          platform_post_id: (result as any).executionId,
          metadata: {
            generatedBy: 'nexa_agent',
            confidence: content.confidence,
            hashtags: content.hashtags,
            callToAction: content.callToAction,
          }
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('post_published', `Post published on ${content.platform}`);
      return post;
    } catch (error) {
      // Save failed post
      await supabaseServer
        .from('posts')
        .insert({
          user_id: this.userId,
          campaign_id: campaignId,
          composio_connection_id: connectionId,
          platform: content.platform as any,
          content: content.content,
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            generatedBy: 'nexa_agent',
          }
        });

      throw error;
    }
  }

  private async logActivity(action: string, description: string, metadata: any = {}) {
    await supabaseServer
      .from('activity_log')
      .insert({
        user_id: this.userId,
        action,
        description,
        metadata: {
          ...metadata,
          agent: 'nexa_core',
        }
      });
  }

  async getAnalyticsSummary(timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const { data: analytics } = await supabaseServer
      .from('analytics')
      .select(`
        *,
        posts!inner(user_id)
      `)
      .eq('posts.user_id', this.userId)
      .gte('created_at', startDate.toISOString());

    // Aggregate analytics
    const summary = {
      totalPosts: analytics?.length || 0,
      totalEngagements: analytics?.reduce((sum, a) => sum + a.engagements, 0) || 0,
      totalImpressions: analytics?.reduce((sum, a) => sum + a.impressions, 0) || 0,
      averageEngagementRate: 0,
    };

    if (summary.totalImpressions > 0) {
      summary.averageEngagementRate = (summary.totalEngagements / summary.totalImpressions) * 100;
    }

    return summary;
  }

  async stopAgent(): Promise<{ success: boolean; message: string }> {
    try {
      await supabaseServer
        .from('users')
        .update({ status: 'agent_paused' })
        .eq('id', this.userId);

      await this.logActivity('agent_stopped', 'AI Growth Agent paused');
      return { success: true, message: 'Agent stopped successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to stop agent' };
    }
  }
}

export class NexaAgentFactory {
  static async createAgent(userId: string): Promise<NexaAgent | null> {
    try {
      // Get user profile and onboarding data
      const { data: user } = await supabaseServer
        .from('users')
        .select('onboarding_data')
        .eq('id', userId)
        .single();

      if (!user?.onboarding_data) {
        return null;
      }

      const onboarding = user.onboarding_data;

      const config: AgentConfig = {
        userId,
        goals: onboarding.promotion_goals || [],
        postingFrequency: onboarding.posting_frequency || 'weekly',
        platforms: ['twitter', 'reddit'], // Could be dynamic
        brandVoice: onboarding.brand_tone || 'professional',
        businessInfo: {
          name: onboarding.business_name || 'Business',
          type: onboarding.business_type || 'company',
          website: onboarding.website_url,
        }
      };

      return new NexaAgent(userId, config);
    } catch (error) {
      console.error('Error creating agent:', error);
      return null;
    }
  }
}
