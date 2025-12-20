/**
 * Twitter/X Composio Toolkit Wrapper
 * Handles all Twitter/X operations via Composio
 */

import { getComposioClient } from './index';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

export interface TwitterPostOptions {
  media_urls?: string[];
  reply_to_id?: string;
  quote_tweet_id?: string;
  scheduled_time?: number;
}

export interface TwitterAnalytics {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  engagement_rate: number;
}

/**
 * Post a tweet
 */
export async function postTweet(
  userId: string,
  content: string,
  options?: TwitterPostOptions
): Promise<{ success: boolean; tweetId?: string; url?: string; error?: string }> {
  try {
    const client = getComposioClient();

    await logger.info('twitter_post', 'Posting tweet', {
      userId,
      contentLength: content.length,
      hasMedia: !!options?.media_urls?.length,
    });

    const result = await client.tools.execute('TWITTER_CREATION_OF_A_POST', {
      userId,
      arguments: {
        text: content,
        ...(options?.reply_to_id && { reply_in_reply_to_tweet_id: options.reply_to_id }),
        ...(options?.quote_tweet_id && { quote_tweet_id: options.quote_tweet_id }),
      },
    });

    const tweetData = result.data as any;
    const tweetId = tweetData?.id || tweetData?.tweet_id;
    const url = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : undefined;

    await logger.info('twitter_post_success', 'Tweet posted successfully', {
      userId,
      tweetId,
    });

    return {
      success: true,
      tweetId,
      url,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_post_error', 'Failed to post tweet', {
      userId,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Like a tweet
 */
export async function likeTweet(
  userId: string,
  tweetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getComposioClient();

    await client.tools.execute('TWITTER_LIKE_A_POST', {
      userId,
      arguments: { tweet_id: tweetId },
    });

    await logger.info('twitter_like', 'Tweet liked', { userId, tweetId });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_like_error', 'Failed to like tweet', {
      userId,
      tweetId,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Retweet a tweet
 */
export async function retweet(
  userId: string,
  tweetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getComposioClient();

    await client.tools.execute('TWITTER_RETWEET', {
      userId,
      arguments: { tweet_id: tweetId },
    });

    await logger.info('twitter_retweet', 'Tweet retweeted', { userId, tweetId });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_retweet_error', 'Failed to retweet', {
      userId,
      tweetId,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Reply to a tweet
 */
export async function replyToTweet(
  userId: string,
  tweetId: string,
  content: string
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('TWITTER_CREATION_OF_A_POST', {
      userId,
      arguments: {
        text: content,
        reply_in_reply_to_tweet_id: tweetId,
      },
    });

    const replyData = result.data as any;
    const replyId = replyData?.id || replyData?.tweet_id;

    await logger.info('twitter_reply', 'Reply posted', {
      userId,
      tweetId,
      replyId,
    });

    return {
      success: true,
      replyId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_reply_error', 'Failed to reply', {
      userId,
      tweetId,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Get user's timeline
 */
export async function getUserTimeline(
  userId: string,
  maxResults: number = 20
): Promise<{ success: boolean; tweets?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('TWITTER_GET_HOME_TIMELINE', {
      userId,
      arguments: { max_results: maxResults },
    });

    const timelineData = result.data as any;
    const tweets = timelineData?.tweets || timelineData?.data || [];

    await logger.info('twitter_timeline', 'Timeline fetched', {
      userId,
      count: tweets.length,
    });

    return {
      success: true,
      tweets,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_timeline_error', 'Failed to fetch timeline', {
      userId,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Get user's tweets
 */
export async function getUserTweets(
  userId: string,
  maxResults: number = 100
): Promise<{ success: boolean; tweets?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('TWITTER_GET_USER_TWEETS', {
      userId,
      arguments: { max_results: maxResults },
    });

    const tweetsData = result.data as any;
    const tweets = tweetsData?.tweets || tweetsData?.data || [];

    await logger.info('twitter_get_tweets', 'User tweets fetched', {
      userId,
      count: tweets.length,
    });

    return {
      success: true,
      tweets,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_get_tweets_error', 'Failed to fetch user tweets', {
      userId,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Search tweets
 */
export async function searchTweets(
  userId: string,
  query: string,
  maxResults: number = 100
): Promise<{ success: boolean; tweets?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('TWITTER_SEARCH_TWEETS', {
      userId,
      arguments: {
        query,
        max_results: maxResults,
      },
    });

    const searchData = result.data as any;
    const tweets = searchData?.tweets || searchData?.data || [];

    await logger.info('twitter_search', 'Tweets searched', {
      userId,
      query,
      count: tweets.length,
    });

    return {
      success: true,
      tweets,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_search_error', 'Failed to search tweets', {
      userId,
      query,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Get tweet details including analytics
 */
export async function getTweetAnalytics(
  userId: string,
  tweetId: string
): Promise<{ success: boolean; analytics?: TwitterAnalytics; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('TWITTER_GET_TWEET', {
      userId,
      arguments: { tweet_id: tweetId },
    });

    const tweetData = result.data as any;
    const analytics: TwitterAnalytics = {
      likes: tweetData?.likes || tweetData?.like_count || 0,
      retweets: tweetData?.retweets || tweetData?.retweet_count || 0,
      replies: tweetData?.replies || tweetData?.reply_count || 0,
      views: tweetData?.views || tweetData?.impression_count || 0,
      engagement_rate: 0, // Calculate if needed
    };

    // Calculate engagement rate
    const totalEngagement = analytics.likes + analytics.retweets + analytics.replies;
    if (analytics.views > 0) {
      analytics.engagement_rate = (totalEngagement / analytics.views) * 100;
    }

    await logger.info('twitter_analytics', 'Tweet analytics fetched', {
      userId,
      tweetId,
      analytics,
    });

    return {
      success: true,
      analytics,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('twitter_analytics_error', 'Failed to fetch tweet analytics', {
      userId,
      tweetId,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}
