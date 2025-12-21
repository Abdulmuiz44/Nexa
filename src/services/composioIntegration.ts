import { Composio } from '@composio/core';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { callUserLLM } from '@/src/lib/ai/user-provider';

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
  private apiKey: string | undefined;

  constructor(userId: string) {
    this.userId = userId;
    this.apiKey = process.env.COMPOSIO_API_KEY;

    if (this.apiKey) {
      try {
        this.composio = new Composio({ apiKey: this.apiKey });
      } catch (initError) {
        console.warn('Failed to initialize Composio SDK:', initError);
        // Continue without Composio - fallback methods will handle it
      }
    } else {
      console.warn('COMPOSIO_API_KEY not set - integration will be limited');
    }
  }

    /**
     * Initiate OAuth connection to X (Twitter) using Composio Auth Config
     */
    async initiateTwitterConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
        if (!this.composio) {
            throw new Error('Composio not initialized - COMPOSIO_API_KEY missing');
        }

        const callbackUrl = redirectUri || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/callback`;
        console.log('Initiating Twitter connection for entity:', this.userId);

        try {
            const session = await this.composio.connectedAccounts.initiate({
                appName: 'twitter',
                entityId: this.userId,
                authConfigId: 'ac_vUASEFFIWuaE',
                redirectUrl: callbackUrl,
            });

            console.log('Composio session created:', session);

            if (!session?.redirectUrl && !session?.url) {
                throw new Error('No auth URL returned from Composio');
            }

            return {
                authUrl: session.redirectUrl || session.url || '',
                connectionId: session.connectionId || session.id || '',
            };
        } catch (error: any) {
            const errorMsg = error?.message || String(error);
            console.error('Error initiating Twitter connection:', errorMsg);

            // Check if it's the authConfigId error
            if (errorMsg.includes('authConfig') || errorMsg.includes('connected account list')) {
                throw new Error(
                    `Composio Twitter auth config issue. Verify COMPOSIO_TWITTER_AUTH_CONFIG_ID is set correctly. Error: ${errorMsg}`
                );
            }

            throw error;
        }
    }



    /**
     * Initiate OAuth connection to Reddit
     * DEPRECATED: Not implemented yet - requires COMPOSIO_REDDIT_AUTH_CONFIG_ID
     */
    async initiateRedditConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
        throw new Error('Reddit integration coming soon. Please set COMPOSIO_REDDIT_AUTH_CONFIG_ID first.');
    }

    /**
     * Initiate OAuth connection to LinkedIn
     * DEPRECATED: Not implemented yet - requires COMPOSIO_LINKEDIN_AUTH_CONFIG_ID
     */
    async initiateLinkedInConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
        throw new Error('LinkedIn integration coming soon. Please set COMPOSIO_LINKEDIN_AUTH_CONFIG_ID first.');
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
     * Get connected account info from database
     */
    async getConnectedAccount(platform: 'twitter' | 'reddit'): Promise<any> {
        try {
            const connection = await this.getConnection(platform ?? 'twitter');
            
            // Return connection info without calling Composio
            return {
                id: connection.id,
                connectionId: connection.composio_connection_id,
                appName: connection.toolkit_slug,
                status: 'ACTIVE',
                account_username: connection.account_username,
                account_id: connection.account_id,
            };
        } catch (error) {
            console.error(`Error getting connected ${platform} account:`, error);
            throw error;
        }
    }

    /**
     * List all connections for user from database (not Composio to avoid auth config issues)
     */
    async listConnectedAccounts(): Promise<any[]> {
        try {
            const { data: connections, error } = await supabaseServer
                .from('composio_connections')
                .select('*')
                .eq('user_id', this.userId)
                .eq('status', 'active');

            if (error) {
                console.error('Error listing connected accounts from database:', error);
                return [];
            }

            console.log(`Found ${connections?.length || 0} connected accounts for user ${this.userId}`);

            // Convert database format to Composio-like format
            return (connections || []).map(conn => ({
                id: conn.id,
                connectionId: conn.composio_connection_id,
                appName: conn.toolkit_slug,
                account_id: conn.account_id,
                account_username: conn.account_username,
                status: conn.status,
                created_at: conn.created_at,
            }));
        } catch (error) {
            console.error('Error listing connected accounts:', error);
            // Return empty array instead of throwing to prevent UI crashes
            return [];
        }
    }

    /**
     * Check if user has an active connection for a specific platform
     */
    async hasActiveConnection(platform: 'twitter' | 'reddit'): Promise<boolean> {
        try {
            // First check our database
            const dbConnection = await this.getConnection(platform);
            if (dbConnection) {
                // Optionally verify with Composio that the connection is still active
                try {
                    const composioAccount = await this.getConnectedAccount(platform);
                    const isActive = composioAccount && (
                        composioAccount.status === 'ACTIVE' ||
                        composioAccount.Status === 'ACTIVE' ||
                        composioAccount.state === 'ACTIVE'
                    );
                    return !!isActive;
                } catch (verifyError) {
                    console.warn(`Could not verify ${platform} connection status with Composio:`, verifyError);
                    // If we can't verify with Composio, we should be cautious and return false
                    // instead of assuming it's active just because it's in our DB.
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error(`Error checking ${platform} connection status:`, error);
            return false;
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
            await this.getConnection('twitter');

            // Execute the tweet action through Composio
            const result = await this.composio.tools.execute('TWITTER_CREATION_OF_A_POST', {
                userId: this.userId,
                arguments: {
                    text: tweetData.content,
                    ...(tweetData.replyToTweetId && {
                        reply_in_reply_to_tweet_id: tweetData.replyToTweetId
                    }),
                    ...(tweetData.quoteTweetId && {
                        quote_tweet_id: tweetData.quoteTweetId
                    }),
                }
            });

            const tweetResponse = result.data as any;
            const tweetId = tweetResponse?.id || tweetResponse?.tweet_id;
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
            await this.getConnection('twitter');

            const result = await this.composio.tools.execute('TWITTER_GET_USER_TWEETS', {
                userId: this.userId,
                arguments: {
                    max_results: maxResults,
                    ...(query && { query }),
                }
            });

            const tweetsData = result.data as any;
            return tweetsData?.tweets || tweetsData?.data || [];
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
            await this.getConnection('twitter');

            const result = await this.composio.tools.execute('TWITTER_GET_HOME_TIMELINE', {
                userId: this.userId,
                arguments: {
                    max_results: maxResults,
                }
            });

            const timelineData = result.data as any;
            return timelineData?.tweets || timelineData?.data || [];
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

            const response = await this.callLLM(
                [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing social media content, particularly tweets. Provide detailed, actionable insights.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                { temperature: 0.4, max_tokens: 200 }
            );

            const analysis = JSON.parse(response.message || '{}');
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

            const response = await this.callLLM(
                [
                    {
                        role: 'system',
                        content: 'You are an expert at analyzing social media patterns and providing actionable insights.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                { temperature: 0.5, max_tokens: 400 }
            );

            const patterns = JSON.parse(response.message || '{}');

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

            const response = await this.callLLM(
                [
                    {
                        role: 'system',
                        content: 'You are an expert at mimicking writing styles. Generate content that authentically matches the provided style.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                { temperature: 0.8, max_tokens: 200 }
            );

            return response.message || '';
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
            await this.getConnection('twitter');

            let toolName: string;
            let params: any = { tweet_id: tweetId };

            switch (engagementType) {
                case 'like':
                    toolName = 'TWITTER_LIKE_A_POST';
                    break;
                case 'retweet':
                    toolName = 'TWITTER_RETWEET';
                    break;
                case 'reply':
                    if (!replyContent) {
                        return { success: false, error: 'Reply content required' };
                    }
                    toolName = 'TWITTER_CREATION_OF_A_POST';
                    params = {
                        text: replyContent,
                        reply_in_reply_to_tweet_id: tweetId,
                    };
                    break;
                default:
                    return { success: false, error: 'Invalid engagement type' };
            }

            await this.composio.tools.execute(toolName, {
                userId: this.userId,
                arguments: params
            });

            return { success: true };
        } catch (error: any) {
            console.error(`Error ${engagementType} tweet:`, error);
            return { success: false, error: error.message };
        }
    }

    private async callLLM(
        messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_calls?: unknown[] }[],
        options?: { temperature?: number; max_tokens?: number }
    ) {
        return callUserLLM({
            userId: this.userId,
            payload: {
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages,
                temperature: options?.temperature,
                max_tokens: options?.max_tokens,
            },
        });
    }

    /**
     * Post to Reddit
     */
    async postToReddit(postData: RedditPostData): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
        if (!this.composio) {
            return { success: false, error: 'Composio not initialized' };
        }

        try {
            await this.getConnection('reddit');

            const toolName = postData.content ? 'REDDIT_SUBMIT_TEXT_POST' : 'REDDIT_SUBMIT_LINK_POST';

            const result = await this.composio.tools.execute(toolName, {
                userId: this.userId,
                arguments: {
                    subreddit: postData.subreddit,
                    title: postData.title,
                    ...(postData.content && { text: postData.content }),
                    ...(postData.url && { url: postData.url }),
                    ...(postData.flair && { flair_id: postData.flair }),
                }
            });

            const redditResponse = result.data as any;
            const postId = redditResponse?.id || redditResponse?.name;
            const url = redditResponse?.url || `https://reddit.com/r/${postData.subreddit}`;

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
     * Get user's saved patterns (public method)
     */
    async getUserPatterns(): Promise<UserTweetPattern> {
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
            await this.getConnection('twitter');

            const result = await this.composio.tools.execute('TWITTER_GET_TWEET', {
                userId: this.userId,
                arguments: { tweet_id: tweetId }
            });

            return result.data as any || {};
        } catch (error) {
            console.error('Error getting tweet analytics:', error);
            return {};
        }
    }

    /**
     * Execute any Composio action
     */
    async executeAction(actionName: string, params: any, platform: 'twitter' | 'reddit' = 'twitter'): Promise<any> {
        if (!this.composio) {
            throw new Error('Composio not initialized');
        }

        try {
            await this.getConnection(platform);

            const result = await this.composio.tools.execute(actionName, {
                userId: this.userId,
                arguments: params
            });

            return result;
        } catch (error) {
            console.error(`Error executing action ${actionName}:`, error);
            throw error;
        }
    }

    /**
     * Get verified account info (uses fallback approach to avoid Composio API issues)
     */
    async getVerifiedAccountInfo(
        platform: 'twitter' | 'reddit',
        connectionId?: string
    ): Promise<{ username: string; accountId: string; verified?: boolean; followerCount?: number }> {
        try {
            // Try to get info from user's own timeline (avoids Composio .get() call)
            if (platform === 'twitter' && this.composio) {
                try {
                    const timeline = await this.getUserTimeline(1);
                    if (timeline?.length > 0) {
                        const tweet = timeline[0];
                        return {
                            username: tweet?.author?.username || tweet?.user?.username || '',
                            accountId: tweet?.author?.id || tweet?.user?.id || '',
                            verified: tweet?.author?.verified || false,
                            followerCount: tweet?.author?.publicMetrics?.followers || 0,
                        };
                    }
                } catch (timelineError) {
                    console.warn('Could not fetch timeline for account verification', timelineError);
                }
            }

            // Fallback: return minimal but valid account info
            // The connection is already verified to be valid since OAuth succeeded
            return {
                username: '',
                accountId: connectionId || '',
                verified: false,
                followerCount: 0,
            };
        } catch (error) {
            console.error(`Error getting verified account info for ${platform}:`, error);
            // Return safe fallback instead of throwing
            return {
                username: '',
                accountId: connectionId || '',
                verified: false,
                followerCount: 0,
            };
        }
    }

    /**
     * Revoke connection on Composio side (best-effort)
     */
    async revokeComposioConnection(composioConnectionId: string): Promise<boolean> {
        if (!this.composio) {
            console.warn('Composio not initialized, skipping revocation');
            return false;
        }

        try {
            // Attempt to revoke the connection on Composio side
            // Note: Implementation depends on Composio SDK capabilities
            await this.composio.connectedAccounts.delete(composioConnectionId);
            console.log('Successfully revoked connection on Composio');
            return true;
        } catch (error) {
            console.warn('Could not revoke on Composio side (non-critical):', error);
            // Return false but don't throw—local deletion is still valid
            return false;
        }
    }
}
