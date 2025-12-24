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
     * Initiate OAuth connection to X (Twitter) using Composio Auth Config
     * Based on Composio docs: https://docs.composio.dev/docs/authenticating-tools
     */
    async initiateTwitterConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
        if (!this.composio) {
            throw new Error('Composio not initialized - COMPOSIO_API_KEY missing');
        }

        const callbackUrl = redirectUri || 'https://backend.composio.dev/api/v3/toolkits/auth/callback';

        console.log('Initiating Twitter connection for user:', this.userId);

        try {
            // Use the direct OAuth connection method per Composio docs
            const authConfigId = process.env.COMPOSIO_TWITTER_AUTH_CONFIG_ID || 'ac_v2MiHIOHVtDM';

            const response = (await (this.composio.connectedAccounts.initiate as any)(
                'TWITTER',
                this.userId,
                {
                    callbackUrl,
                    authConfigId,
                }
            )) as any;

            console.log('Composio session response:', {
                hasRedirectUrl: !!response?.redirectUrl,
                hasId: !!response?.id,
            });

            const authUrl = response?.redirectUrl;
            const connectionId = response?.id;

            if (!authUrl) {
                throw new Error('No auth URL returned from Composio. Check that authConfigId is correct.');
            }

            if (!connectionId) {
                throw new Error('No connection ID returned from Composio');
            }

            return {
                authUrl,
                connectionId,
            };
        } catch (error: any) {
            const errorMsg = error?.message || String(error);
            console.error('Error initiating Twitter connection:', {
                message: errorMsg,
                error: error,
                apiKey: process.env.COMPOSIO_API_KEY ? 'set' : 'missing',
            });

            throw new Error(
                `Failed to initiate Twitter OAuth: ${errorMsg}. ` +
                `Ensure COMPOSIO_API_KEY is set and authConfigId=ac_v2MiHIOHVtDM is correct.`
            );
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
    async getConnection(platform: 'twitter' | 'reddit' | 'linkedin'): Promise<any> {
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
    async getConnectedAccount(platform: 'twitter' | 'reddit' | 'linkedin'): Promise<any> {
        if (!this.composio) {
            throw new Error('Composio not initialized');
        }

        try {
            const connection = await this.getConnection(platform ?? 'twitter');

            // Get the connected account details from Composio
            const response = await this.composio.connectedAccounts.get(connection.composio_connection_id);
            const account = response?.data || response;

            return account;
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
    async hasActiveConnection(platform: 'twitter' | 'reddit' | 'linkedin'): Promise<boolean> {
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
     * Get verified account info from Composio (for display after OAuth)
     */
    async getVerifiedAccountInfo(
        platform: 'twitter' | 'reddit',
        connectionId?: string
    ): Promise<{ username: string; accountId: string; verified?: boolean; followerCount?: number }> {
        if (!this.composio) {
            throw new Error('Composio not initialized');
        }

        try {
            const connection = connectionId
                ? { composio_connection_id: connectionId }
                : await this.getConnection(platform);

            if (!connection?.composio_connection_id) {
                throw new Error('No valid connection ID found');
            }

            // Get account details from Composio
            try {
                const account = await this.composio.connectedAccounts.get(
                    connection.composio_connection_id
                );

                const accountData = account?.data || account;

                return {
                    username: (accountData as any)?.username || (accountData as any)?.name || '',
                    accountId: (accountData as any)?.id || connection.composio_connection_id || '',
                    verified: (accountData as any)?.verified || false,
                    followerCount: (accountData as any)?.followers || 0,
                };
            } catch (apiError) {
                // Fallback: try to get info from a test action
                console.warn(`Could not fetch account from Composio, using fallback for ${platform}`, apiError);

                if (platform === 'twitter') {
                    try {
                        const timeline = await this.getUserTimeline(1);
                        if (timeline?.length > 0) {
                            const tweet = timeline[0] as any;
                            return {
                                username: tweet?.author?.username || tweet?.user?.username || 'unknown',
                                accountId: tweet?.author?.id || tweet?.user?.id || connection.composio_connection_id || '',
                                verified: tweet?.author?.verified || false,
                                followerCount: tweet?.author?.publicMetrics?.followers || 0,
                            };
                        }
                    } catch (fallbackError) {
                        console.warn('Fallback method also failed', fallbackError);
                    }
                }

                throw new Error(`Could not verify ${platform} account`);
            }
        } catch (error) {
            console.error(`Error getting verified account info for ${platform}:`, error);
            throw error;
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
