// NEXA - Core Orchestration System
// This is the brain that coordinates all platform activities

import { createClient } from '@supabase/supabase-js';
import { twitterIntegration } from '../platforms/enhanced-x';
import { redditIntegration } from '../platforms/enhanced-reddit';
import { discordTelegramIntegration } from '../platforms/discord-telegram';

interface Campaign {
  id: string;
  tool_id: string;
  name: string;
  prompt_template: string;
  platforms: string[];
  frequency: string;
  active: boolean;
  target_audience: string;
  tone: string;
  hashtags: string[];
}

interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  keywords: string[];
  features: string[];
  priority: number;
}

interface PostDecision {
  action: 'post' | 'wait';
  platform: string;
  content: string;
  campaignId: string;
  toolId: string;
  scheduledFor?: Date;
}

class NexaOrchestrator {
  private supabase;
  private platforms: Map<string, any> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializePlatforms();
  }

  private initializePlatforms() {
    this.platforms.set('twitter', twitterIntegration);
    this.platforms.set('reddit', redditIntegration);
    this.platforms.set('discord', discordTelegramIntegration);
    this.platforms.set('telegram', discordTelegramIntegration);
  }

  // Main orchestration method - called by cron job
  async orchestrate(): Promise<void> {
    console.log('🚀 Nexa Orchestrator starting...');
    
    try {
      // Get active campaigns and tools
      const { campaigns, tools } = await this.getActiveCampaignsAndTools();
      
      if (campaigns.length === 0) {
        console.log('No active campaigns found');
        return;
      }

      console.log(`Found ${campaigns.length} active campaigns for ${tools.length} tools`);

      // Make posting decisions
      const decisions = await this.makePostingDecisions(campaigns, tools);
      
      console.log(`Made ${decisions.length} posting decisions`);

      // Execute decisions
      await this.executeDecisions(decisions);
      
      // Update analytics
      await this.updateAnalytics();

      console.log('✅ Nexa Orchestrator completed successfully');
    } catch (error) {
      console.error('❌ Nexa Orchestrator failed:', error);
    }
  }

  // Get active campaigns and their associated tools
  private async getActiveCampaignsAndTools(): Promise<{ campaigns: Campaign[]; tools: Tool[] }> {
    const { data: campaigns, error: campaignsError } = await this.supabase
      .from('campaigns')
      .select(`
        *,
        tools (*)
      `)
      .eq('active', true);

    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`);
    }

    const { data: tools, error: toolsError } = await this.supabase
      .from('tools')
      .select('*')
      .eq('active', true);

    if (toolsError) {
      throw new Error(`Failed to fetch tools: ${toolsError.message}`);
    }

    return { campaigns: campaigns || [], tools: tools || [] };
  }

  // Intelligent posting decision engine
  private async makePostingDecisions(campaigns: Campaign[], tools: Tool[]): Promise<PostDecision[]> {
    const decisions: PostDecision[] = [];

    for (const campaign of campaigns) {
      const tool = tools.find(t => t.id === campaign.tool_id);
      if (!tool) continue;

      // Check if we should post based on frequency and last post
      const shouldPost = await this.shouldPostForCampaign(campaign);
      if (!shouldPost) continue;

      // Generate content for each platform in the campaign
      for (const platform of campaign.platforms) {
        try {
          const content = await this.generateContentForPlatform(
            platform,
            campaign,
            tool
          );

          const scheduledTime = await this.getOptimalPostTime(platform);

          decisions.push({
            action: 'post',
            platform,
            content,
            campaignId: campaign.id,
            toolId: tool.id,
            scheduledFor: scheduledTime
          });
        } catch (error) {
          console.error(`Failed to create decision for ${platform}:`, error);
        }
      }
    }

    return decisions;
  }

  // Check if campaign should post based on frequency
  private async shouldPostForCampaign(campaign: Campaign): Promise<boolean> {
    const { data: lastPost } = await this.supabase
      .from('posts')
      .select('created_at')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!lastPost || lastPost.length === 0) {
      return true; // First post
    }

    const lastPostTime = new Date(lastPost[0].created_at);
    const now = new Date();
    const hoursSinceLastPost = (now.getTime() - lastPostTime.getTime()) / (1000 * 60 * 60);

    const frequencyHours: { [key: string]: number } = {
      'hourly': 1,
      'daily': 24,
      'every-2-days': 48,
      'weekly': 168
    };

    const requiredHours = frequencyHours[campaign.frequency] || 24;
    return hoursSinceLastPost >= requiredHours;
  }

  // Generate platform-specific content
  private async generateContentForPlatform(
    platform: string,
    campaign: Campaign,
    tool: Tool
  ): Promise<string> {
    const platformIntegration = this.platforms.get(platform);
    
    if (!platformIntegration) {
      throw new Error(`Platform ${platform} not supported`);
    }

    // Use platform-specific content generation
    if (platform === 'twitter') {
      const variations = platformIntegration.generateContentVariations('', tool);
      return variations[Math.floor(Math.random() * variations.length)];
    } else if (platform === 'reddit') {
      const content = platformIntegration.generateRedditContent(tool, 'technology');
      return `${content.title}\n\n${content.content}`;
    } else if (platform === 'discord') {
      return platformIntegration.generateDiscordContent(tool);
    } else if (platform === 'telegram') {
      return platformIntegration.generateTelegramContent(tool);
    }

    // Fallback content
    return this.generateFallbackContent(tool, campaign);
  }

  // Get optimal posting time for platform
  private async getOptimalPostTime(platform: string): Promise<Date> {
    const platformIntegration = this.platforms.get(platform);
    const optimalTimes = platformIntegration?.getOptimalPostingTimes() || ['12:00'];
    
    const randomTime = optimalTimes[Math.floor(Math.random() * optimalTimes.length)];
    const [hours, minutes] = randomTime.split(':').map(Number);
    
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledDate < new Date()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return scheduledDate;
  }

  // Execute posting decisions
  private async executeDecisions(decisions: PostDecision[]): Promise<void> {
    for (const decision of decisions) {
      try {
        await this.executePostDecision(decision);
        await this.sleep(1000); // Rate limiting between posts
      } catch (error) {
        console.error(`Failed to execute decision for ${decision.platform}:`, error);
      }
    }
  }

  // Execute individual post decision
  private async executePostDecision(decision: PostDecision): Promise<void> {
    const platform = this.platforms.get(decision.platform);
    if (!platform) return;

    let postId: string | null = null;
    let status = 'failed';

    try {
      // Post to platform
      if (decision.platform === 'twitter') {
        postId = await platform.post(decision.content);
      } else if (decision.platform === 'reddit') {
        // Extract title and content for Reddit
        const lines = decision.content.split('\n\n');
        const title = lines[0];
        const content = lines.slice(1).join('\n\n');
        const subreddits = await platform.getRelevantSubreddits({ category: 'AI Tool' });
        if (subreddits.length > 0) {
          postId = await platform.post(subreddits[0], title, content);
        }
      } else if (decision.platform === 'discord') {
        const success = await platform.postToDiscord(decision.content, { name: 'Tool', url: '' });
        postId = success ? 'discord_' + Date.now() : null;
      } else if (decision.platform === 'telegram') {
        const success = await platform.postToTelegram(decision.content, { name: 'Tool', url: '' });
        postId = success ? 'telegram_' + Date.now() : null;
      }

      status = postId ? 'posted' : 'failed';
    } catch (error) {
      console.error(`Failed to post to ${decision.platform}:`, error);
    }

    // Record the post attempt
    await this.recordPost({
      campaign_id: decision.campaignId,
      platform: decision.platform,
      content: decision.content,
      platform_post_id: postId,
      status,
      posted_at: new Date().toISOString()
    });
  }

  // Record post in database
  private async recordPost(postData: any): Promise<void> {
    const { error } = await this.supabase
      .from('posts')
      .insert(postData);

    if (error) {
      console.error('Failed to record post:', error);
    }
  }

  // Update analytics data
  private async updateAnalytics(): Promise<void> {
    try {
      // Get recent posts that need metrics updates
      const { data: posts } = await this.supabase
        .from('posts')
        .select('*')
        .eq('status', 'posted')
        .gte('posted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!posts) return;

      for (const post of posts) {
        try {
          await this.updatePostMetrics(post);
          await this.sleep(500); // Rate limiting
        } catch (error) {
          console.error(`Failed to update metrics for post ${post.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  // Update metrics for a specific post
  private async updatePostMetrics(post: any): Promise<void> {
    const platform = this.platforms.get(post.platform);
    if (!platform || !post.platform_post_id) return;

    try {
      let metrics = null;

      if (post.platform === 'twitter' && platform.getPostMetrics) {
        metrics = await platform.getPostMetrics(post.platform_post_id);
      } else if (post.platform === 'reddit' && platform.getPostMetrics) {
        metrics = await platform.getPostMetrics(post.platform_post_id);
      }

      if (metrics) {
        await this.supabase
          .from('analytics')
          .upsert({
            post_id: post.id,
            platform: post.platform,
            impressions: metrics.impressions || 0,
            likes: metrics.likes || metrics.upvotes || 0,
            shares: metrics.shares || metrics.retweets || 0,
            comments: metrics.comments || metrics.replies || 0,
            engagement_rate: this.calculateEngagementRate(metrics),
            recorded_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error(`Failed to fetch metrics for ${post.platform}:`, error);
    }
  }

  // Calculate engagement rate
  private calculateEngagementRate(metrics: any): number {
    const impressions = metrics.impressions || 1;
    const engagement = (metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0);
    return impressions > 0 ? (engagement / impressions) * 100 : 0;
  }

  // Generate fallback content
  private generateFallbackContent(tool: Tool, campaign: Campaign): string {
    const templates = [
      `🚀 Discovered an amazing ${tool.category}: ${tool.name}! ${tool.description} Check it out: ${tool.url} ${campaign.hashtags?.join(' ') || ''}`,
      `💡 ${tool.name} is revolutionizing ${tool.category}. ${tool.description} Perfect for ${campaign.target_audience}. ${tool.url}`,
      `⭐ New find: ${tool.name} - ${tool.description} Great for anyone working with ${tool.category}. ${tool.url} ${campaign.hashtags?.join(' ') || ''}`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Helper method for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public method to add new campaign
  async addCampaign(campaignData: Partial<Campaign>): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      console.error('Failed to add campaign:', error);
      return null;
    }

    return data?.id || null;
  }

  // Public method to add new tool
  async addTool(toolData: Partial<Tool>): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('tools')
      .insert(toolData)
      .select()
      .single();

    if (error) {
      console.error('Failed to add tool:', error);
      return null;
    }

    return data?.id || null;
  }

  // Get campaign performance summary
  async getCampaignPerformance(campaignId: string): Promise<any> {
    const { data } = await this.supabase
      .from('posts')
      .select(`
        *,
        analytics (*)
      `)
      .eq('campaign_id', campaignId);

    if (!data) return null;

    const totalPosts = data.length;
    const totalImpressions = data.reduce((sum, post) => 
      sum + (post.analytics?.[0]?.impressions || 0), 0);
    const totalEngagement = data.reduce((sum, post) => {
      const analytics = post.analytics?.[0];
      return sum + (analytics?.likes || 0) + (analytics?.shares || 0) + (analytics?.comments || 0);
    }, 0);

    return {
      totalPosts,
      totalImpressions,
      totalEngagement,
      avgEngagementRate: totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0,
      platforms: [...new Set(data.map(p => p.platform))]
    };
  }
}

export const nexaOrchestrator = new NexaOrchestrator();
export default NexaOrchestrator;