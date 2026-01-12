import { post_to_platform, PostInput, PostResponse } from './postToPlatform';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { TwitterApi } from 'twitter-api-v2';
import Snoowrap from 'snoowrap';

export type Platform = 'twitter' | 'reddit';

export class SocialMediaService {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Check if user has a valid connection for the platform
     */
    async hasActiveConnection(platform: Platform): Promise<boolean> {
        const { data } = await supabaseServer
            .from('connected_accounts')
            .select('id')
            .eq('user_id', this.userId)
            .eq('platform', platform)
            .maybeSingle();

        return !!data;
    }

    /**
     * Post content to the specified platform
     */
    async post(platform: Platform, content: string, mediaUrl?: string): Promise<PostResponse> {
        return post_to_platform({
            platform,
            userId: this.userId,
            content,
            mediaUrl
        });
    }

    /**
     * Get analytics for a specific post
     */
    async getPostAnalytics(platform: Platform, platformPostId: string): Promise<any> {
        if (platform === 'twitter') {
            return this.getTwitterAnalytics(platformPostId);
        } else if (platform === 'reddit') {
            return this.getRedditAnalytics(platformPostId);
        }
        return {};
    }

    async engage(platform: Platform, type: 'like' | 'retweet' | 'reply' | 'comment', postId: string, content?: string): Promise<any> {
        if (platform === 'twitter') {
            const client = await this.getTwitterClient();
            if (type === 'like') return client.v2.like(await this.getMeId('twitter'), postId);
            if (type === 'retweet') return client.v2.retweet(await this.getMeId('twitter'), postId);
            if (type === 'reply') return client.v2.reply(content || '', postId);
        }
        // Reddit engagement would use Snoowrap similarly
        throw new Error('Engagement not implemented for this platform');
    }

    async analyzeUserPatterns(platform: Platform): Promise<any> {
        // Placeholder - would require fetching timeline and analyzing with LLM
        return {};
    }

    private async getMeId(platform: Platform): Promise<string> {
        const { data } = await supabaseServer
            .from('connected_accounts')
            .select('platform_user_id')
            .eq('user_id', this.userId)
            .eq('platform', platform)
            .single();
        return data?.platform_user_id || '';
    }

    private async getTwitterClient(): Promise<TwitterApi> {
        const { data } = await supabaseServer
            .from('connected_accounts')
            .select('access_token') // assuming token refresh is handled or we reuse logic from postToPlatform
            .eq('user_id', this.userId)
            .eq('platform', 'twitter')
            .single();

        if (!data) throw new Error('No Twitter connection');
        return new TwitterApi(data.access_token);
    }

    private async getTwitterAnalytics(tweetId: string) {
        try {
            const client = await this.getTwitterClient();
            const tweet = await client.v2.singleTweet(tweetId, {
                'tweet.fields': ['public_metrics', 'non_public_metrics']
            });
            return tweet.data.public_metrics || {};
        } catch (error) {
            console.error('Error fetching Twitter analytics:', error);
            return {};
        }
    }

    private async getRedditClient(): Promise<Snoowrap> {
        const { data } = await supabaseServer
            .from('connected_accounts')
            .select('access_token, refresh_token')
            .eq('user_id', this.userId)
            .eq('platform', 'reddit')
            .single();

        if (!data) throw new Error('No Reddit connection');

        return new Snoowrap({
            userAgent: process.env.REDDIT_USER_AGENT || 'nexa-app/1.0',
            clientId: process.env.REDDIT_CLIENT_ID,
            clientSecret: process.env.REDDIT_CLIENT_SECRET,
            refreshToken: data.refresh_token,
            accessToken: data.access_token
        });
    }

    private async getRedditAnalytics(postId: string) {
        try {
            const client = await this.getRedditClient();
            const submission = await client.getSubmission(postId).fetch();
            return {
                score: submission.score,
                upvoteRatio: submission.upvote_ratio,
                comments: submission.num_comments,
                awards: submission.total_awards_received
            };
        } catch (error) {
            console.error('Error fetching Reddit analytics:', error);
            return {};
        }
    }
}
