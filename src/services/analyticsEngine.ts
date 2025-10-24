import { composio } from '@/lib/composio';
import { supabaseServer } from '@/src/lib/supabaseServer';

interface PostAnalytics {
  postId: string;
  platform: 'twitter' | 'reddit';
  connectionId: string;
  platformPostId: string;
}

export class AnalyticsEngine {
  async collectPostAnalytics(postId: string): Promise<void> {
    try {
      // Get post details
      const { data: post } = await supabaseServer
        .from('posts')
        .select(`
          *,
          composio_connections(*)
        `)
        .eq('id', postId)
        .single();

      if (!post || !post.composio_connections) {
        console.error('Post or connection not found for analytics');
        return;
      }

      const connection = post.composio_connections;
      const platform = post.platform;
      const platformPostId = post.platform_post_id;

      if (!platformPostId) {
        console.error('No platform post ID found');
        return;
      }

      // Fetch analytics from platform via Composio
      const analytics = await this.fetchPlatformAnalytics(
        platform,
        platformPostId,
        connection.composio_connection_id,
        connection.toolkit_slug
      );

      if (analytics) {
        // Store in database
        await supabaseServer
          .from('analytics')
          .insert({
            post_id: postId,
            platform: platform as any,
            impressions: analytics.impressions || 0,
            engagements: analytics.engagements || 0,
            likes: analytics.likes || 0,
            comments: analytics.comments || 0,
            shares: analytics.shares || 0,
            clicks: analytics.clicks || 0,
            engagement_rate: analytics.engagementRate || 0,
            fetched_at: new Date(),
          });

        // Log activity
        await this.logAnalyticsCollection(post.user_id, postId, analytics);
      }
    } catch (error) {
      console.error('Error collecting post analytics:', error);
    }
  }

  async collectBulkAnalytics(userId: string): Promise<void> {
    try {
      // Get all published posts from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: posts } = await supabaseServer
        .from('posts')
        .select(`
          *,
          composio_connections(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .gte('published_at', thirtyDaysAgo.toISOString());

      if (!posts) return;

      // Collect analytics for each post
      for (const post of posts) {
        await this.collectPostAnalytics(post.id);
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await this.logActivity(userId, 'bulk_analytics_collected', `Collected analytics for ${posts.length} posts`);
    } catch (error) {
      console.error('Error in bulk analytics collection:', error);
    }
  }

  private async fetchPlatformAnalytics(
    platform: string,
    postId: string,
    connectionId: string,
    toolkitSlug: string
  ): Promise<any> {
    try {
      let actionName: string;
      let input: any = {};

      if (platform === 'twitter') {
        actionName = 'get_tweet_metrics';
        input = { tweet_id: postId };
      } else if (platform === 'reddit') {
        actionName = 'get_post_info';
        input = { post_id: postId };
      } else {
        return null;
      }

      const result = await composio.tools.execute({
        connectionId,
        appName: toolkitSlug,
        actionName,
        input,
      });

      // Normalize the response
      return this.normalizeAnalyticsResponse(platform, result);
    } catch (error) {
      console.error(`Error fetching ${platform} analytics:`, error);
      return null;
    }
  }

  private normalizeAnalyticsResponse(platform: string, response: any): any {
    if (platform === 'twitter') {
      return {
        impressions: response.data?.public_metrics?.impressions || 0,
        engagements: response.data?.public_metrics?.engagements || 0,
        likes: response.data?.public_metrics?.like_count || 0,
        comments: response.data?.public_metrics?.reply_count || 0,
        shares: response.data?.public_metrics?.retweet_count || 0,
        clicks: response.data?.public_metrics?.url_clicks || 0,
        engagementRate: this.calculateEngagementRate(response.data?.public_metrics),
      };
    } else if (platform === 'reddit') {
      return {
        impressions: response.data?.view_count || 0,
        engagements: (response.data?.ups || 0) + (response.data?.num_comments || 0),
        likes: response.data?.ups || 0,
        comments: response.data?.num_comments || 0,
        shares: 0, // Reddit doesn't have direct shares
        clicks: 0,
        engagementRate: 0, // Would need more complex calculation
      };
    }

    return null;
  }

  private calculateEngagementRate(metrics: any): number {
    if (!metrics || !metrics.impressions || metrics.impressions === 0) return 0;

    const engagements = (metrics.engagements || 0);
    return (engagements / metrics.impressions) * 100;
  }

  async getAnalyticsSummary(userId: string, timeframe: 'day' | 'week' | 'month' = 'week') {
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
        posts!inner(user_id, platform)
      `)
      .eq('posts.user_id', userId)
      .gte('fetched_at', startDate.toISOString());

    if (!analytics) return this.getEmptySummary();

    // Aggregate by platform
    const platformStats = analytics.reduce((acc, item) => {
      const platform = item.posts.platform;
      if (!acc[platform]) {
        acc[platform] = {
          posts: 0,
          impressions: 0,
          engagements: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          avgEngagementRate: 0,
        };
      }

      acc[platform].posts += 1;
      acc[platform].impressions += item.impressions;
      acc[platform].engagements += item.engagements;
      acc[platform].likes += item.likes;
      acc[platform].comments += item.comments;
      acc[platform].shares += item.shares;
      acc[platform].clicks += item.clicks;

      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(platformStats).forEach(platform => {
      const stats = platformStats[platform];
      stats.avgEngagementRate = stats.impressions > 0
        ? (stats.engagements / stats.impressions) * 100
        : 0;
    });

    return {
      timeframe,
      totalPosts: analytics.length,
      platforms: platformStats,
      overall: {
        impressions: Object.values(platformStats).reduce((sum: number, p: any) => sum + p.impressions, 0),
        engagements: Object.values(platformStats).reduce((sum: number, p: any) => sum + p.engagements, 0),
        avgEngagementRate: Object.values(platformStats).reduce((sum: number, p: any) => sum + p.avgEngagementRate, 0) / Object.keys(platformStats).length,
      }
    };
  }

  private getEmptySummary() {
    return {
      timeframe: 'week',
      totalPosts: 0,
      platforms: {},
      overall: {
        impressions: 0,
        engagements: 0,
        avgEngagementRate: 0,
      }
    };
  }

  async getPerformanceInsights(userId: string): Promise<any> {
    // Analyze trends and provide insights
    const weeklyStats = await this.getAnalyticsSummary(userId, 'week');
    const monthlyStats = await this.getAnalyticsSummary(userId, 'month');

    return {
      weekly: weeklyStats,
      monthly: monthlyStats,
      insights: this.generateInsights(weeklyStats, monthlyStats),
      recommendations: this.generateRecommendations(weeklyStats),
    };
  }

  private generateInsights(weekly: any, monthly: any): string[] {
    const insights: string[] = [];

    if (weekly.totalPosts > 0) {
      insights.push(`Posted ${weekly.totalPosts} times this week`);

      if (weekly.overall.avgEngagementRate > 5) {
        insights.push('Excellent engagement rate above 5%');
      } else if (weekly.overall.avgEngagementRate > 2) {
        insights.push('Good engagement rate above 2%');
      } else {
        insights.push('Consider optimizing content for better engagement');
      }
    }

    return insights;
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.totalPosts === 0) {
      recommendations.push('Start posting regularly to build momentum');
    } else if (stats.totalPosts < 3) {
      recommendations.push('Increase posting frequency for better reach');
    }

    if (stats.overall.avgEngagementRate < 1) {
      recommendations.push('Try different content types or posting times');
      recommendations.push('Engage with your audience through replies');
    }

    return recommendations;
  }

  private async logAnalyticsCollection(userId: string, postId: string, analytics: any) {
    await supabaseServer
      .from('activity_log')
      .insert({
        user_id: userId,
        action: 'analytics_collected',
        description: `Analytics collected for post ${postId}`,
        metadata: {
          post_id: postId,
          impressions: analytics.impressions,
          engagements: analytics.engagements,
        }
      });
  }

  private async logActivity(userId: string, action: string, description: string, metadata: any = {}) {
    await supabaseServer
      .from('activity_log')
      .insert({
        user_id: userId,
        action,
        description,
        metadata,
      });
  }
}

export const analyticsEngine = new AnalyticsEngine();
