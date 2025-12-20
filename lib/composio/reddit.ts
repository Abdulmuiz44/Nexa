/**
 * Reddit Composio Toolkit Wrapper
 * Handles all Reddit operations via Composio
 */

import { getComposioClient } from './index';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

export interface RedditPostOptions {
  flair_id?: string;
  nsfw?: boolean;
  spoiler?: boolean;
}

export interface RedditAnalytics {
  upvotes: number;
  downvotes: number;
  comments: number;
  views: number;
  score: number;
}

/**
 * Post text to Reddit
 */
export async function postTextToReddit(
  userId: string,
  subreddit: string,
  title: string,
  content: string,
  options?: RedditPostOptions
): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
  try {
    const client = getComposioClient();

    await logger.info('reddit_post_text', 'Posting text to Reddit', {
      userId,
      subreddit,
      titleLength: title.length,
      contentLength: content.length,
    });

    const result = await client.tools.execute('REDDIT_SUBMIT_TEXT_POST', {
      userId,
      arguments: {
        subreddit,
        title,
        text: content,
        ...(options?.flair_id && { flair_id: options.flair_id }),
        ...(options?.nsfw && { nsfw: options.nsfw }),
        ...(options?.spoiler && { spoiler: options.spoiler }),
      },
    });

    const postData = result.data as any;
    const postId = postData?.id || postData?.name;
    const url = postData?.url || `https://reddit.com/r/${subreddit}/`;

    await logger.info('reddit_post_text_success', 'Text posted to Reddit', {
      userId,
      subreddit,
      postId,
    });

    return {
      success: true,
      postId,
      url,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('reddit_post_text_error', 'Failed to post to Reddit', {
      userId,
      subreddit,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Post link to Reddit
 */
export async function postLinkToReddit(
  userId: string,
  subreddit: string,
  title: string,
  url: string,
  options?: RedditPostOptions
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const client = getComposioClient();

    await logger.info('reddit_post_link', 'Posting link to Reddit', {
      userId,
      subreddit,
      titleLength: title.length,
    });

    const result = await client.tools.execute('REDDIT_SUBMIT_LINK_POST', {
      userId,
      arguments: {
        subreddit,
        title,
        url,
        ...(options?.flair_id && { flair_id: options.flair_id }),
        ...(options?.nsfw && { nsfw: options.nsfw }),
        ...(options?.spoiler && { spoiler: options.spoiler }),
      },
    });

    const postData = result.data as any;
    const postId = postData?.id || postData?.name;
    const postUrl = postData?.url || `https://reddit.com/r/${subreddit}/`;

    await logger.info('reddit_post_link_success', 'Link posted to Reddit', {
      userId,
      subreddit,
      postId,
    });

    return {
      success: true,
      postId,
      postUrl,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('reddit_post_link_error', 'Failed to post link to Reddit', {
      userId,
      subreddit,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Post comment to Reddit
 */
export async function postCommentToReddit(
  userId: string,
  postId: string,
  content: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  try {
    const client = getComposioClient();

    await logger.info('reddit_post_comment', 'Posting comment to Reddit', {
      userId,
      postId,
      contentLength: content.length,
    });

    const result = await client.tools.execute('REDDIT_POST_COMMENT', {
      userId,
      arguments: {
        thing_id: postId,
        text: content,
      },
    });

    const commentData = result.data as any;
    const commentId = commentData?.id || commentData?.name;

    await logger.info('reddit_post_comment_success', 'Comment posted to Reddit', {
      userId,
      postId,
      commentId,
    });

    return {
      success: true,
      commentId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('reddit_post_comment_error', 'Failed to post comment', {
      userId,
      postId,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Get user's posts from Reddit
 */
export async function getUserPosts(
  userId: string,
  maxResults: number = 50
): Promise<{ success: boolean; posts?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('REDDIT_GET_USER_POSTS', {
      userId,
      arguments: { limit: maxResults },
    });

    const postsData = result.data as any;
    const posts = postsData?.data?.children || postsData?.posts || [];

    await logger.info('reddit_get_posts', 'User posts fetched', {
      userId,
      count: posts.length,
    });

    return {
      success: true,
      posts,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('reddit_get_posts_error', 'Failed to fetch user posts', {
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
 * Search subreddit
 */
export async function searchSubreddit(
  userId: string,
  query: string,
  maxResults: number = 50
): Promise<{ success: boolean; subreddits?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('REDDIT_SEARCH_SUBREDDITS', {
      userId,
      arguments: {
        query,
        limit: maxResults,
      },
    });

    const searchData = result.data as any;
    const subreddits = searchData?.data?.children || searchData?.subreddits || [];

    await logger.info('reddit_search', 'Subreddits searched', {
      userId,
      query,
      count: subreddits.length,
    });

    return {
      success: true,
      subreddits,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('reddit_search_error', 'Failed to search subreddit', {
      userId,
      query,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Get subreddit posts
 */
export async function getSubredditPosts(
  userId: string,
  subreddit: string,
  maxResults: number = 50
): Promise<{ success: boolean; posts?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('REDDIT_GET_SUBREDDIT_POSTS', {
      userId,
      arguments: {
        subreddit,
        limit: maxResults,
      },
    });

    const postsData = result.data as any;
    const posts = postsData?.data?.children || postsData?.posts || [];

    await logger.info('reddit_subreddit_posts', 'Subreddit posts fetched', {
      userId,
      subreddit,
      count: posts.length,
    });

    return {
      success: true,
      posts,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('reddit_subreddit_posts_error', 'Failed to fetch subreddit posts', {
      userId,
      subreddit,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Get post analytics
 */
export async function getPostAnalytics(
  userId: string,
  postId: string
): Promise<{ success: boolean; analytics?: RedditAnalytics; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('REDDIT_GET_POST', {
      userId,
      arguments: { post_id: postId },
    });

    const postData = result.data as any;
    const analytics: RedditAnalytics = {
      upvotes: postData?.ups || postData?.upvotes || 0,
      downvotes: postData?.downs || postData?.downvotes || 0,
      comments: postData?.num_comments || postData?.comments || 0,
      views: postData?.views || 0,
      score: postData?.score || 0,
    };

    await logger.info('reddit_analytics', 'Post analytics fetched', {
      userId,
      postId,
      analytics,
    });

    return {
      success: true,
      analytics,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('reddit_analytics_error', 'Failed to fetch post analytics', {
      userId,
      postId,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}
