// NEXA - Enhanced X/Twitter Integration (Free API v2)
// Copy-paste this for X/Twitter automation

interface TwitterPost {
  text: string;
  media?: string[];
  scheduled_for?: Date;
}

interface TwitterMetrics {
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  profile_clicks: number;
  url_clicks: number;
}

class EnhancedTwitterIntegration {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    if (!this.bearerToken) {
      console.warn('Twitter Bearer Token not found. Twitter integration disabled.');
    }
  }

  // Post to Twitter
  async post(content: string, mediaUrls?: string[]): Promise<string | null> {
    try {
      if (!this.bearerToken) {
        throw new Error('Twitter Bearer Token not configured');
      }

      const tweetData: any = {
        text: this.formatContent(content)
      };

      // Add media if provided
      if (mediaUrls && mediaUrls.length > 0) {
        const mediaIds = await this.uploadMedia(mediaUrls);
        if (mediaIds.length > 0) {
          tweetData.media = { media_ids: mediaIds };
        }
      }

      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tweetData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twitter API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      return result.data?.id || null;
    } catch (error) {
      console.error('Failed to post to Twitter:', error);
      return null;
    }
  }

  // Get optimal posting times based on audience analysis
  async getOptimalPostingTimes(): Promise<string[]> {
    // Based on general Twitter analytics research
    return [
      '09:00', '10:00', '11:00', // Morning engagement
      '13:00', '14:00', '15:00', // Lunch time
      '17:00', '18:00', '19:00'  // Evening engagement
    ];
  }

  // Get trending hashtags related to AI/tech
  async getTrendingHashtags(): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/trends/place?id=1`, // Worldwide trends
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          }
        }
      );

      if (!response.ok) return this.getFallbackHashtags();

      const data = await response.json();
      const trends = data[0]?.trends || [];
      
      // Filter for tech/AI related trends
      const techTrends = trends
        .filter((trend: any) => this.isTechRelated(trend.name))
        .slice(0, 5)
        .map((trend: any) => trend.name);

      return techTrends.length > 0 ? techTrends : this.getFallbackHashtags();
    } catch (error) {
      console.error('Failed to get trending hashtags:', error);
      return this.getFallbackHashtags();
    }
  }

  // Get post metrics
  async getPostMetrics(tweetId: string): Promise<TwitterMetrics | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const metrics = data.data?.public_metrics || {};
      const organicMetrics = data.data?.organic_metrics || {};

      return {
        impressions: organicMetrics.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        profile_clicks: organicMetrics.profile_clicks || 0,
        url_clicks: organicMetrics.url_link_clicks || 0
      };
    } catch (error) {
      console.error('Failed to get post metrics:', error);
      return null;
    }
  }

  // Schedule a post (for future implementation with cron jobs)
  async schedulePost(content: string, scheduledFor: Date): Promise<boolean> {
    // Store in database for cron job to pick up
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabase
        .from('posts')
        .insert({
          platform: 'twitter',
          content: content,
          scheduled_for: scheduledFor.toISOString(),
          status: 'scheduled'
        });

      return !error;
    } catch (error) {
      console.error('Failed to schedule post:', error);
      return false;
    }
  }

  // Enhanced content formatting for Twitter
  private formatContent(content: string): string {
    let formatted = content;

    // Ensure it fits Twitter's character limit
    if (formatted.length > 280) {
      formatted = formatted.substring(0, 277) + '...';
    }

    // Add line breaks for better readability
    formatted = formatted.replace(/\. /g, '.\n\n');

    return formatted;
  }

  // Upload media to Twitter
  private async uploadMedia(mediaUrls: string[]): Promise<string[]> {
    const mediaIds: string[] = [];
    
    for (const url of mediaUrls.slice(0, 4)) { // Max 4 images
      try {
        // Download media
        const mediaResponse = await fetch(url);
        const mediaBuffer = await mediaResponse.arrayBuffer();
        
        // Upload to Twitter
        const formData = new FormData();
        formData.append('media', new Blob([mediaBuffer]));
        
        const uploadResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          mediaIds.push(uploadResult.media_id_string);
        }
      } catch (error) {
        console.error('Failed to upload media:', error);
      }
    }

    return mediaIds;
  }

  // Check if a trend is tech/AI related
  private isTechRelated(trendName: string): boolean {
    const techKeywords = [
      'AI', 'ML', 'tech', 'coding', 'developer', 'startup', 'SaaS',
      'automation', 'algorithm', 'data', 'software', 'app', 'digital',
      'innovation', 'technology', 'programming', 'code', 'API'
    ];

    return techKeywords.some(keyword => 
      trendName.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Fallback hashtags when trending API fails
  private getFallbackHashtags(): string[] {
    const hashtagSets = [
      ['#AI', '#MachineLearning', '#TechInnovation', '#Automation', '#StartupLife'],
      ['#ArtificialIntelligence', '#TechTools', '#Productivity', '#SaaS', '#Innovation'],
      ['#AITools', '#TechStartup', '#DigitalTransformation', '#FutureOfWork', '#Technology'],
      ['#SmartTech', '#AIAssistant', '#TechSolutions', '#Efficiency', '#DigitalTools']
    ];

    const randomSet = hashtagSets[Math.floor(Math.random() * hashtagSets.length)];
    return randomSet;
  }

  // Generate Twitter-optimized content variations
  generateContentVariations(baseContent: string, tool: any): string[] {
    const variations = [
      // Question format
      `🤔 Looking for ${tool.category?.toLowerCase() || 'AI tools'}? \n\n${baseContent}\n\n${this.getRandomHashtags().join(' ')}`,
      
      // Problem-solution format  
      `💡 Problem: ${this.getCommonProblem(tool.category)}\nSolution: ${tool.name}\n\n${tool.description}\n\n🔗 ${tool.url}\n\n${this.getRandomHashtags().join(' ')}`,
      
      // Thread starter format
      `🧵 Thread: Why ${tool.name} is changing the game:\n\n1/ ${baseContent}\n\n${this.getRandomHashtags().join(' ')}`,
      
      // Comparison format
      `⚡ ${tool.name} vs Traditional Methods:\n\n✅ ${tool.features?.[0] || 'Smart automation'}\n✅ ${tool.features?.[1] || 'Time-saving'}\n✅ ${tool.features?.[2] || 'Easy to use'}\n\n🔗 ${tool.url}`,
      
      // User testimonial format
      `🚀 "Just tried ${tool.name} and I'm impressed!" \n\n${baseContent}\n\nAnyone else using this? ${this.getRandomHashtags().join(' ')}`
    ];

    return variations;
  }

  private getCommonProblem(category?: string): string {
    const problems: { [key: string]: string } = {
      'Trading AI': 'Struggling with trading analysis and performance tracking',
      'AI Tool': 'Spending too much time on repetitive tasks',
      'Productivity': 'Low productivity and workflow inefficiencies',
      'Analytics': 'Lack of actionable insights from data'
    };

    return problems[category || 'AI Tool'] || 'Complex workflows taking too much time';
  }

  private getRandomHashtags(): string[] {
    return this.getFallbackHashtags().slice(0, 3);
  }

  // Check if the integration is properly configured
  isConfigured(): boolean {
    return !!this.bearerToken;
  }
}

export const twitterIntegration = new EnhancedTwitterIntegration();
export default EnhancedTwitterIntegration;