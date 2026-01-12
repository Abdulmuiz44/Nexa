import { NexaBase } from './nexaBase';
import { SocialMediaService, Platform } from '@/src/services/socialMediaService';
import { supabaseServer } from '@/src/lib/supabaseServer';

export interface CreatePostParams {
  platform: Platform;
  content: string;
  mediaUrls?: string[];
  subreddit?: string;
}

export interface SchedulePostParams {
  platform: Platform;
  content: string;
  scheduledAt: string;
  mediaUrls?: string[];
  subreddit?: string;
}

export interface PerformanceParams {
  postId?: string;
  period?: string;
  platform?: Platform;
}

export class GrowthAgent extends NexaBase {
  private socialMediaService: SocialMediaService;

  constructor(userId: string) {
    super(userId);
    this.socialMediaService = new SocialMediaService(userId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async executeAction(action: string, params: any): Promise<any> {
    try {
      await this.log('execute_action', `Executing ${action}`, params);

      switch (action) {
        case 'create_post':
          return await this.createPost(params);
        case 'schedule_post':
          return await this.schedulePost(params);
        case 'analyze_performance':
          return await this.analyzePerformance(params);
        case 'engage_with_post':
          return await this.engageWithPost(params);
        case 'analyze_user_patterns':
          return await this.analyzeUserPatterns(params);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.log('error', errorMsg, params);
      throw error;
    }
  }

  private async createPost(params: CreatePostParams): Promise<any> {
    const { platform, content, mediaUrls, subreddit } = params;

    const hasConnection = await this.socialMediaService.hasActiveConnection(platform);
    if (!hasConnection) {
      throw new Error(`No active ${platform} connection for user ${this.userId}`);
    }

    const result = await this.socialMediaService.post(platform, content, mediaUrls?.[0]);

    if (!result.success) {
      throw new Error(result.error || 'Failed to post');
    }

    const { data: savedPost } = await supabaseServer
      .from('posts')
      .insert({
        user_id: this.userId,
        platform,
        content,
        status: 'published',
        published_at: new Date().toISOString(),
        platform_post_id: result.platformPostId,
        url: result.platformPostUrl,
        metadata: {
          created_by: 'growth_agent',
          subreddit
        },
      })
      .select()
      .single();

    return {
      success: true,
      platform,
      postId: result.platformPostId,
      url: result.platformPostUrl,
      savedPostId: savedPost?.id
    };
  }

  private async schedulePost(params: SchedulePostParams): Promise<any> {
    const { platform, content, scheduledAt, subreddit } = params;

    const hasConnection = await this.socialMediaService.hasActiveConnection(platform);
    if (!hasConnection) {
      throw new Error(`No active ${platform} connection`);
    }

    const { data: scheduledPost } = await supabaseServer
      .from('posts') // Standardizing on 'posts' table with status='scheduled'
      .insert({
        user_id: this.userId,
        platform,
        content,
        status: 'scheduled',
        scheduled_at: scheduledAt,
        metadata: {
          created_by: 'growth_agent',
          subreddit
        }
      })
      .select()
      .single();

    return {
      success: true,
      scheduleId: scheduledPost?.id,
      scheduledAt
    };
  }

  private async analyzePerformance(params: PerformanceParams): Promise<any> {
    const { postId, platform } = params;
    if (!postId || !platform) throw new Error('Post ID and platform required');

    const analytics = await this.socialMediaService.getPostAnalytics(platform, postId);

    return {
      success: true,
      postId,
      analytics
    };
  }

  private async engageWithPost(params: any): Promise<any> {
    const { platform, postId, engagementType, content } = params;
    await this.socialMediaService.engage(platform, engagementType, postId, content);
    return { success: true };
  }

  private async analyzeUserPatterns(params: any): Promise<any> {
    const { platform } = params;
    return await this.socialMediaService.analyzeUserPatterns(platform);
  }
}
