import { Composio } from '@composio/core';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { openaiClient } from '@/lib/openaiClient';

interface ComposioConnectionConfig {
  userId: string;
  platform: 'twitter' | 'reddit';
  redirectUri?: string;
}

interface TweetData {
  content: string;
  mediaUrls?: string[];
  replyToTweetId?: string;
  quoteTweetId?: string;
}

interface RedditPostData {
  subreddit: string;
  title: string;
  content?: string;
  url?: string;
  flair?: string;
}

interface TweetAnalysis {
  sentiment: string;
  topics: string[];
  hooks: string[];
  style: string;
  voice: string;
  structure: string;
  engagement_potential: number;
}

interface UserTweetPattern {
  common_hooks: string[];
  typical_structure: string;
  voice_characteristics: string;
  engagement_patterns: {
    best_time: string;
    best_day: string;
    avg_engagement: number;
  };
  content_themes: string[];
}

export class ComposioIntegrationService {
  private composio: Composio | undefined;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    const apiKey = process.env.COMPOSIO_API_KEY;
    
    if (apiKey) {
      this.composio = new Composio({ apiKey });
    } else {
      console.warn('COMPOSIO_API_KEY not set - integration will be limited');
    }
  }

  /**
   * Initiate OAuth connection to X (Twitter)
   */
  async initiateTwitterConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
    if (!this.composio) {
      throw new Error('Composio not initialized - COMPOSIO_API_KEY missing');
    }

    try {
      const callbackUrl = redirectUri || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/callback`;
      
      // Use Composio's connection initiation with proper parameters
      const connection = await this.composio.connectedAccounts.initiate({
        integrationId: 'twitter',
        entityId: this.userId,
        redirectUrl: callbackUrl,
        data: {
          // Add any additional required parameters
        }
      });

      console.log('Twitter connection initiated:', { 
        connectionId: connection.connectionId,
        redirectUrl: connection.redirectUrl 
      });

      return {
        authUrl: connection.redirectUrl || '',
        connectionId: connection.connectionId || '',
      };
    } catch (error) {
      console.error('Error initiating Twitter connection:', error);
      throw error;
    }
  }

  /**
   * Initiate OAuth connection to Reddit
   */
  async initiateRedditConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
    if (!this.composio) {
      throw new Error('Composio not initialized - COMPOSIO_API_KEY missing');
    }

    try {
      const callbackUrl = redirectUri || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/callback`;
      
      const connection = await this.composio.connectedAccounts.initiate({
        integrationId: 'reddit',
        entityId: this.userId,
        redirectUrl: callbackUrl,
        data: {
          // Add any additional required parameters
        }
      });

      console.log('Reddit connection initiated:', {
        connectionId: connection.connectionId,
        redirectUrl: connection.redirectUrl
      });

      return {
        authUrl: connection.redirectUrl || '',
        connectionId: connection.connectionId || '',
      };
    } catch (error) {
      console.error('Error initiating Reddit connection:', error);
      throw error;
    }
  }

  /**
   * Get active connection for a platform
   */
  async getConnection(platform: 'twitter' | 'reddit'): Promise<any> {
    try {
      const { data: connection } = await supabaseServer
        .from('composio_connections')
        .select('*')
        .eq('user_id', this.userId)
        .eq('toolkit_slug', platform)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!connection) {
        throw new Error(`No ${platform} connection found for user`);
      }

      return connection;
    } catch (error) {
      console.error(`Error getting ${platform} connection:`, error);
      throw error;
    }
  }

  /**
   * Verify and get connected account from Composio
   */
  async getConnectedAccount(platform: 'twitter' | 'reddit'): Promise<any> {
    if (!this.composio) {
      throw new Error('Composio not initialized');
    }

    try {
      const connection = await this.getConnection(platform);
      
      // Get the connected account details from Composio
      const account = await this.composio.connectedAccounts.get({
        connectedAccountId: connection.composio_connection_id
      });

      return account;
    } catch (error) {
      console.error(`Error getting connected ${platform} account:`, error);
      throw error;
    }
  }

  /**
   * List all connections for user from Composio
   */
  async listConnectedAccounts(): Promise<any[]> {
    if (!this.composio) {
      return [];
    }

    try {
      const accounts = await this.composio.connectedAccounts.list({
        entityIds: [this.userId]
      });

      return accounts.items || [];
    } catch (error) {
      console.error('Error listing connected accounts:', error);
      return [];
    }
  }

  /**
   * Post a tweet to X
   */
  async postTweet(tweetData: TweetData): Promise<{ success: boolean; tweetId?: string; url?: string; error?: string }> {
    if (!this.composio) {
      return { success: false, error: 'Composio not initialized' };
    }

    try {
      const connection = await this.getConnection('twitter');

      // Execute the tweet action through Composio
      const result = await this.composio.actions.execute({
        actionName: 'TWITTER_CREATE_TWEET',
        params: {
          text: tweetData.content,
          ...(tweetData.replyToTweetId && { 
            reply: { in_reply_to_tweet_id: tweetData.replyToTweetId } 
          }),
          ...(tweetData.quoteTweetId && { 
            quote_tweet_id: tweetData.quoteTweetId 
          }),
        },
        connectedAccountId: connection.composio_connection_id,
      });

      const tweetId = result.data?.id || result.data?.tweet_id;
      const url = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : undefined;

      return {
        success: true,
        tweetId,
        url,
      };
    } catch (error: any) {
      console.error('Error posting tweet:', error);
      return {
        success: false,
        error: error.message || 'Failed to post tweet',
      };
    }
  }

  /**
   * Search user's tweets
   */
  async searchUserTweets(query?: string, maxResults: number = 100): Promise<any[]> {
    if (!this.composio) {
      throw new Error('Composio not initialized');
    }

    try {
      const connection = await this.getConnection('twitter');

      const result = await this.composio.actions.execute({
        actionName: 'TWITTER_GET_USER_TWEETS',
        params: {
          max_results: maxResults,
          ...(query && { query }),
        },
        connectedAccountId: connection.composio_connection_id,
      });

      return result.data?.tweets || result.data?.data || [];
    } catch (error) {
      console.error('Error searching tweets:', error);
      return [];
    }
  }

  /**
   * Get user's timeline/home timeline
   */
  async getUserTimeline(maxResults: number = 20): Promise<any[]> {
    if (!this.composio) {
      throw new Error('Composio not initialized');
    }

    try {
      const connection = await this.getConnection('twitter');

      const result = await this.composio.actions.execute({
        actionName: 'TWITTER_GET_HOME_TIMELINE',
        params: {
          max_results: maxResults,
        },
        connectedAccountId: connection.composio_connection_id,
      });

      return result.data?.tweets || result.data?.data || [];
    } catch (error) {
      console.error('Error getting timeline:', error);
      return [];
    }
  }

  /**
   * Analyze a tweet's characteristics
   */
  async analyzeTweet(tweetContent: string): Promise<TweetAnalysis> {
    try {
      const prompt = `Analyze this tweet and extract key characteristics:

Tweet: "${tweetContent}"

Provide analysis in the following JSON format:
{
  "sentiment": "positive/negative/neutral",
  "topics": ["topic1", "topic2"],
  "hooks": ["specific hook phrases used"],
  "style": "description of writing style",
  "voice": "description of voice/tone",
  "structure": "description of structure (thread, single, with media, etc)",
  "engagement_potential": 0-100
}`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing social media content, particularly tweets. Provide detailed, actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return analysis;
    } catch (error) {
      console.error('Error analyzing tweet:', error);
      return {
        sentiment: 'neutral',
        topics: [],
        hooks: [],
        style: 'unknown',
        voice: 'unknown',
        structure: 'unknown',
        engagement_potential: 50,
      };
    }
  }

  /**
   * Analyze user's tweet patterns from historical data
   */
  async analyzeUserTweetPatterns(): Promise<UserTweetPattern> {
    try {
      // Get user's recent tweets
      const tweets = await this.searchUserTweets(undefined, 100);

      if (tweets.length === 0) {
        throw new Error('No tweets found to analyze');
      }

      // Analyze each tweet
      const analyses = await Promise.all(
        tweets.slice(0, 20).map((tweet: any) => this.analyzeTweet(tweet.text || tweet.content))
      );

      // Aggregate patterns
      const prompt = `Based on these tweet analyses, identify the user's patterns:

${JSON.stringify(analyses, null, 2)}

Provide a comprehensive pattern analysis in the following JSON format:
{
  "common_hooks": ["list of frequently used hooks/openings"],
  "typical_structure": "description of how user typically structures tweets",
  "voice_characteristics": "description of consistent voice/tone characteristics",
  "engagement_patterns": {
    "best_time": "time of day with best engagement",
    "best_day": "day of week with best engagement",
    "avg_engagement": "average engagement rate"
  },
  "content_themes": ["main themes/topics user posts about"]
}`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing social media patterns and providing actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const patterns = JSON.parse(response.choices[0].message.content || '{}');
      
      // Save patterns to database for future reference
      await this.saveUserPatterns(patterns);

      return patterns;
    } catch (error) {
      console.error('Error analyzing user tweet patterns:', error);
      throw error;
    }
  }

  /**
   * Generate a tweet in user's style
   */
  async generateTweetInUserStyle(topic: string, context?: string): Promise<string> {
    try {
      // Get user's patterns
      const patterns = await this.getUserPatterns();

      const prompt = `Generate a tweet about "${topic}" using the following user's style:

Voice: ${patterns.voice_characteristics}
Structure: ${patterns.typical_structure}
Common hooks: ${patterns.common_hooks.join(', ')}
Themes: ${patterns.content_themes.join(', ')}

${context ? `Additional context: ${context}` : ''}

Generate a tweet that matches this user's authentic style. Return only the tweet text, no additional formatting or explanation.`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at mimicking writing styles. Generate content that authentically matches the provided style.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 280,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating tweet in user style:', error);
      throw error;
    }
  }

  /**
   * Auto-engage with relevant tweets (like, retweet, reply)
   */
  async autoEngageWithTweet(
    tweetId: string,
    engagementType: 'like' | 'retweet' | 'reply',
    replyContent?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.composio) {
      return { success: false, error: 'Composio not initialized' };
    }

    try {
      const connection = await this.getConnection('twitter');

      let actionName: string;
      let params: any = { tweet_id: tweetId };

      switch (engagementType) {
        case 'like':
          actionName = 'TWITTER_LIKE_TWEET';
          break;
        case 'retweet':
          actionName = 'TWITTER_RETWEET';
          break;
        case 'reply':
          if (!replyContent) {
            return { success: false, error: 'Reply content required' };
          }
          actionName = 'TWITTER_CREATE_TWEET';
          params = {
            text: replyContent,
            reply: { in_reply_to_tweet_id: tweetId },
          };
          break;
        default:
          return { success: false, error: 'Invalid engagement type' };
      }

      await this.composio.actions.execute({
        actionName,
        params,
        connectedAccountId: connection.composio_connection_id,
      });

      return { success: true };
    } catch (error: any) {
      console.error(`Error ${engagementType} tweet:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Post to Reddit
   */
  async postToReddit(postData: RedditPostData): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
    if (!this.composio) {
      return { success: false, error: 'Composio not initialized' };
    }

    try {
      const connection = await this.getConnection('reddit');

      const actionName = postData.content ? 'REDDIT_SUBMIT_TEXT_POST' : 'REDDIT_SUBMIT_LINK_POST';
      
      const result = await this.composio.actions.execute({
        actionName,
        params: {
          subreddit: postData.subreddit,
          title: postData.title,
          ...(postData.content && { text: postData.content }),
          ...(postData.url && { url: postData.url }),
          ...(postData.flair && { flair_id: postData.flair }),
        },
        connectedAccountId: connection.composio_connection_id,
      });

      const postId = result.data?.id || result.data?.name;
      const url = result.data?.url || `https://reddit.com/r/${postData.subreddit}`;

      return {
        success: true,
        postId,
        url,
      };
    } catch (error: any) {
      console.error('Error posting to Reddit:', error);
      return {
        success: false,
        error: error.message || 'Failed to post to Reddit',
      };
    }
  }

  /**
   * Schedule a post for later
   */
  async schedulePost(
    platform: 'twitter' | 'reddit',
    content: any,
    scheduledAt: Date
  ): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
    try {
      const connection = await this.getConnection(platform);

      const { data: scheduledPost, error } = await supabaseServer
        .from('posts')
        .insert({
          user_id: this.userId,
          platform,
          content: JSON.stringify(content),
          status: 'scheduled',
          scheduled_at: scheduledAt.toISOString(),
          composio_connection_id: connection.id,
          metadata: {
            created_by: 'composio_integration',
          },
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        scheduleId: scheduledPost.id,
      };
    } catch (error: any) {
      console.error('Error scheduling post:', error);
      return {
        success: false,
        error: error.message || 'Failed to schedule post',
      };
    }
  }

  /**
   * Get user's saved patterns
   */
  private async getUserPatterns(): Promise<UserTweetPattern> {
    try {
      const { data: user } = await supabaseServer
        .from('users')
        .select('onboarding_data')
        .eq('id', this.userId)
        .single();

      if (user?.onboarding_data?.tweet_patterns) {
        return user.onboarding_data.tweet_patterns;
      }

      // If no patterns saved, analyze and save them
      return await this.analyzeUserTweetPatterns();
    } catch (error) {
      console.error('Error getting user patterns:', error);
      throw error;
    }
  }

  /**
   * Save user's patterns to database
   */
  private async saveUserPatterns(patterns: UserTweetPattern): Promise<void> {
    try {
      const { data: user } = await supabaseServer
        .from('users')
        .select('onboarding_data')
        .eq('id', this.userId)
        .single();

      const updatedOnboardingData = {
        ...(user?.onboarding_data || {}),
        tweet_patterns: patterns,
        patterns_analyzed_at: new Date().toISOString(),
      };

      await supabaseServer
        .from('users')
        .update({ onboarding_data: updatedOnboardingData })
        .eq('id', this.userId);
    } catch (error) {
      console.error('Error saving user patterns:', error);
    }
  }

  /**
   * Get tweet analytics
   */
  async getTweetAnalytics(tweetId: string): Promise<any> {
    if (!this.composio) {
      throw new Error('Composio not initialized');
    }

    try {
      const connection = await this.getConnection('twitter');

      const result = await this.composio.actions.execute({
        actionName: 'TWITTER_GET_TWEET',
        params: { id: tweetId },
        connectedAccountId: connection.composio_connection_id,
      });

      return result.data || {};
    } catch (error) {
      console.error('Error getting tweet analytics:', error);
      return {};
    }
  }

  /**
   * Execute any Composio action
   */
  async executeAction(actionName: string, params: any, platform: 'twitter' | 'reddit'): Promise<any> {
    if (!this.composio) {
      throw new Error('Composio not initialized');
    }

    try {
      const connection = await this.getConnection(platform);

      const result = await this.composio.actions.execute({
        actionName,
        params,
        connectedAccountId: connection.composio_connection_id,
      });

      return result;
    } catch (error) {
      console.error(`Error executing action ${actionName}:`, error);
      throw error;
    }
  }
}
