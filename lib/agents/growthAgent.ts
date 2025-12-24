import { NexaBase } from './nexaBase';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';
import { supabaseServer } from '@/src/lib/supabaseServer';
import * as TwitterToolkit from '@/lib/composio/twitter';
import * as RedditToolkit from '@/lib/composio/reddit';
import * as LinkedInToolkit from '@/lib/composio/linkedin';

export type SocialMediaPlatform = 'twitter' | 'reddit' | 'linkedin';

export interface CreatePostParams {
  platform: SocialMediaPlatform;
  content: string;
  mediaUrls?: string[];
  connectionId?: string;
  subreddit?: string;
}

export interface SchedulePostParams {
  platform: SocialMediaPlatform;
  content: string;
  scheduledAt: string;
  mediaUrls?: string[];
  connectionId?: string;
  subreddit?: string;
}

export interface PerformanceParams {
  postId?: string;
  period?: string;
  platform?: SocialMediaPlatform;
}

/**
 * Growth Agent: Executes autonomous posting actions using Composio
 */
export class GrowthAgent extends NexaBase {
  private composioService: ComposioIntegrationService;

  constructor(userId: string) {
    super(userId);
    this.composioService = new ComposioIntegrationService(userId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async executeAction(action: string, params: any): Promise<any> {
    try {
      switch (action) {
        case 'create_post':
          return await this.createPost(params as CreatePostParams);
        case 'schedule_post':
          return await this.schedulePost(params as SchedulePostParams);
        case 'analyze_performance':
          return await this.analyzePerformance(params as PerformanceParams);
        case 'engage_with_post':
          return await this.engageWithPost(params);
        case 'analyze_user_patterns':
          return await this.analyzeUserPatterns(params);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.logError(action, errorMsg, params);
      throw error;
    }
  }

  /**
   * Create and post content to social media via Composio
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createPost(params: CreatePostParams): Promise<any> {
    const { platform, content, mediaUrls, subreddit } = params;

    await this.log('create_post', `Creating post on ${platform}`, {
      platform,
      contentLength: content.length,
      hasMedia: !!mediaUrls?.length,
    });

    // Check if user has active connection
    const hasConnection = await this.composioService.hasActiveConnection(platform);
    if (!hasConnection) {
      throw new Error(`No active ${platform} connection for user ${this.userId}`);
    }

    let result;

    try {
      switch (platform) {
        case 'twitter':
          result = await TwitterToolkit.postTweet(this.userId, content, {
            media_urls: mediaUrls,
          });
          break;

        case 'reddit':
          // Use provided subreddit or default to a safe generic one if env not set
          const targetSubreddit = subreddit || process.env.DEFAULT_SUBREDDIT || 'u_' + this.userId;
          result = await RedditToolkit.postTextToReddit(
            this.userId,
            targetSubreddit,
            content.substring(0, 50) + '...', // Use first 50 chars as title if not provided
            content
          );
          break;

        case 'linkedin':
          result = await LinkedInToolkit.postToLinkedIn(this.userId, content, {
            media_urls: mediaUrls,
          });
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to post');
      }

      // Extract the correct ID based on platform (Twitter returns tweetId, others return postId)
      const externalPostId = (result as any).postId || (result as any).tweetId;

      // Save post to database
      const { data: savedPost } = await supabaseServer
        .from('posts')
        .insert({
          user_id: this.userId,
          platform,
          content,
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: externalPostId,
          url: result.url,
          metadata: {
            created_by: 'growth_agent',
            posted_at: new Date().toISOString(),
            subreddit: platform === 'reddit' ? subreddit : undefined,
          },
        })
        .select()
        .single();

      await this.log('create_post', `Successfully posted to ${platform}`, {
        platform,
        postId: externalPostId,
        url: result.url,
      });

      return {
        success: true,
        platform,
        postId: externalPostId,
        url: result.url,
        savedPostId: savedPost?.id,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logError('create_post', errorMsg, params);
      throw error;
    }
  }

  /**
   * Schedule a post for later publication
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async schedulePost(params: SchedulePostParams): Promise<any> {
    const { platform, content, scheduledAt, mediaUrls, subreddit } = params;

    await this.log('schedule_post', `Scheduling post on ${platform}`, {
      platform,
      scheduledAt,
      contentLength: content.length,
    });

    try {
      // Save scheduled post to database
      const { data: savedPost } = await supabaseServer
        .from('posts')
        .insert({
          user_id: this.userId,
          platform,
          content,
          status: 'scheduled',
          scheduled_at: new Date(scheduledAt).toISOString(),
          metadata: {
            created_by: 'growth_agent',
            scheduled_at: new Date(scheduledAt).toISOString(),
            media_urls: mediaUrls || [],
            subreddit: platform === 'reddit' ? subreddit : undefined,
          },
        })
        .select()
        .single();

      await this.log('schedule_post', `Successfully scheduled post for ${platform}`, {
        platform,
        postId: savedPost?.id,
        scheduledAt,
      });

      return {
        success: true,
        platform,
        postId: savedPost?.id,
        scheduledAt,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logError('schedule_post', errorMsg, params);
      throw error;
    }
  }

  /**
   * Analyze post performance and engagement
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async analyzePerformance(params: PerformanceParams): Promise<any> {
    const { postId, period = '24h', platform } = params;

    await this.log('analyze_performance', 'Analyzing post performance', {
      postId,
      period,
      platform,
    });

    try {
      if (!postId || !platform) {
        throw new Error('postId and platform are required');
      }

      let analytics;

      switch (platform) {
        case 'twitter':
          const twitterResult = await TwitterToolkit.getTweetAnalytics(this.userId, postId);
          analytics = twitterResult.success ? twitterResult.analytics : null;
          break;

        case 'reddit':
          const redditResult = await RedditToolkit.getPostAnalytics(this.userId, postId);
          analytics = redditResult.success ? redditResult.analytics : null;
          break;

        case 'linkedin':
          const linkedinResult = await LinkedInToolkit.getPostAnalytics(this.userId, postId);
          analytics = linkedinResult.success ? linkedinResult.analytics : null;
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      if (!analytics) {
        throw new Error(`Failed to fetch analytics for ${platform}`);
      }

      await this.log('analyze_performance', 'Performance analysis completed', {
        postId,
        platform,
        analytics,
      });

      return {
        success: true,
        postId,
        platform,
        analytics,
        period,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logError('analyze_performance', errorMsg, params);
      throw error;
    }
  }

  /**
   * Engage with posts (like, retweet, reply)
   */
  private async engageWithPost(params: {
    platform: SocialMediaPlatform;
    postId: string;
    engagementType: 'like' | 'retweet' | 'reply' | 'comment';
    content?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<any> {
    const { platform, postId, engagementType, content } = params;

    await this.log('engage_with_post', `Engaging with post: ${engagementType}`, {
      platform,
      postId,
      engagementType,
    });

    try {
      let result;

      switch (platform) {
        case 'twitter':
          if (engagementType === 'like') {
            result = await TwitterToolkit.likeTweet(this.userId, postId);
          } else if (engagementType === 'retweet') {
            result = await TwitterToolkit.retweet(this.userId, postId);
          } else if (engagementType === 'reply' && content) {
            result = await TwitterToolkit.replyToTweet(this.userId, postId, content);
          }
          break;

        case 'reddit':
          if (engagementType === 'comment' && content) {
            result = await RedditToolkit.postCommentToReddit(this.userId, postId, content);
          }
          break;

        case 'linkedin':
          if (engagementType === 'like') {
            result = await LinkedInToolkit.likeLinkedInPost(this.userId, postId);
          } else if (engagementType === 'comment' && content) {
            result = await LinkedInToolkit.commentOnLinkedInPost(this.userId, postId, content);
          }
          break;
      }

      if (!result) {
        throw new Error('Invalid engagement type for platform');
      }

      await this.log('engage_with_post', `Successfully engaged with post`, {
        platform,
        postId,
        engagementType,
      });

      return {
        success: result.success,
        platform,
        postId,
        engagementType,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logError('engage_with_post', errorMsg, params);
      throw error;
    }
  }

  /**
   * Analyze user's posting patterns for personalized content generation
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async analyzeUserPatterns(params: { platform: SocialMediaPlatform }): Promise<any> {
    const { platform } = params;

    await this.log('analyze_patterns', `Analyzing user patterns on ${platform}`, { platform });

    try {
      if (platform !== 'twitter') {
        throw new Error('Pattern analysis currently only supports Twitter');
      }

      const patterns = await this.composioService.analyzeUserTweetPatterns();

      await this.log('analyze_patterns', 'User patterns analyzed', {
        platform,
        patterns,
      });

      return {
        success: true,
        platform,
        patterns,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logError('analyze_patterns', errorMsg, params);
      throw error;
    }
  }
}
