/**
 * LinkedIn Composio Toolkit Wrapper
 * Handles all LinkedIn operations via Composio
 */

import { getComposioClient } from './index';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

export interface LinkedInPostOptions {
  media_urls?: string[];
  visibility?: 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';
  article_url?: string;
}

export interface LinkedInAnalytics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement_rate: number;
}

/**
 * Post to LinkedIn
 */
export async function postToLinkedIn(
  userId: string,
  content: string,
  options?: LinkedInPostOptions
): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
  try {
    const client = getComposioClient();

    await logger.info('linkedin_post', 'Posting to LinkedIn', {
      userId,
      contentLength: content.length,
      hasMedia: !!options?.media_urls?.length,
    });

    const result = await client.tools.execute('LINKEDIN_POST_CREATION', {
      userId,
      arguments: {
        text: content,
        visibility: options?.visibility || 'PUBLIC',
        ...(options?.media_urls && { media_urls: options.media_urls }),
        ...(options?.article_url && { article_url: options.article_url }),
      },
    });

    const postData = result.data as any;
    const postId = postData?.id || postData?.post_id || postData?.urn;
    const url = postData?.url || `https://www.linkedin.com/feed/update/${postId}`;

    await logger.info('linkedin_post_success', 'Post published to LinkedIn', {
      userId,
      postId,
    });

    return {
      success: true,
      postId,
      url,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('linkedin_post_error', 'Failed to post to LinkedIn', {
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
 * Comment on LinkedIn post
 */
export async function commentOnLinkedInPost(
  userId: string,
  postId: string,
  content: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  try {
    const client = getComposioClient();

    await logger.info('linkedin_comment', 'Commenting on LinkedIn post', {
      userId,
      postId,
      contentLength: content.length,
    });

    const result = await client.tools.execute('LINKEDIN_POST_COMMENT', {
      userId,
      arguments: {
        post_id: postId,
        text: content,
      },
    });

    const commentData = result.data as any;
    const commentId = commentData?.id || commentData?.comment_id;

    await logger.info('linkedin_comment_success', 'Comment posted to LinkedIn', {
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
    await logger.error('linkedin_comment_error', 'Failed to post comment', {
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
 * Like LinkedIn post
 */
export async function likeLinkedInPost(
  userId: string,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getComposioClient();

    await client.tools.execute('LINKEDIN_LIKE_POST', {
      userId,
      arguments: { post_id: postId },
    });

    await logger.info('linkedin_like', 'Post liked on LinkedIn', {
      userId,
      postId,
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('linkedin_like_error', 'Failed to like post', {
      userId,
      postId,
      error: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<{ success: boolean; profile?: any; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('LINKEDIN_GET_USER_PROFILE', {
      userId,
      arguments: {},
    });

    const profileData = result.data as any;

    await logger.info('linkedin_profile', 'User profile fetched', {
      userId,
    });

    return {
      success: true,
      profile: profileData,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('linkedin_profile_error', 'Failed to fetch user profile', {
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
 * Get user's posts
 */
export async function getUserPosts(
  userId: string,
  maxResults: number = 50
): Promise<{ success: boolean; posts?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('LINKEDIN_GET_USER_POSTS', {
      userId,
      arguments: { limit: maxResults },
    });

    const postsData = result.data as any;
    const posts = postsData?.posts || postsData?.data || [];

    await logger.info('linkedin_get_posts', 'User posts fetched', {
      userId,
      count: posts.length,
    });

    return {
      success: true,
      posts,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('linkedin_get_posts_error', 'Failed to fetch user posts', {
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
 * Search LinkedIn users
 */
export async function searchUsers(
  userId: string,
  query: string,
  maxResults: number = 50
): Promise<{ success: boolean; users?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('LINKEDIN_SEARCH_USERS', {
      userId,
      arguments: {
        query,
        limit: maxResults,
      },
    });

    const searchData = result.data as any;
    const users = searchData?.users || searchData?.data || [];

    await logger.info('linkedin_search', 'Users searched', {
      userId,
      query,
      count: users.length,
    });

    return {
      success: true,
      users,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('linkedin_search_error', 'Failed to search users', {
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
 * Get post analytics
 */
export async function getPostAnalytics(
  userId: string,
  postId: string
): Promise<{ success: boolean; analytics?: LinkedInAnalytics; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('LINKEDIN_GET_POST_ANALYTICS', {
      userId,
      arguments: { post_id: postId },
    });

    const postData = result.data as any;
    const analytics: LinkedInAnalytics = {
      likes: postData?.likes || postData?.like_count || 0,
      comments: postData?.comments || postData?.comment_count || 0,
      shares: postData?.shares || postData?.share_count || 0,
      views: postData?.views || postData?.impression_count || 0,
      engagement_rate: 0,
    };

    // Calculate engagement rate
    const totalEngagement = analytics.likes + analytics.comments + analytics.shares;
    if (analytics.views > 0) {
      analytics.engagement_rate = (totalEngagement / analytics.views) * 100;
    }

    await logger.info('linkedin_analytics', 'Post analytics fetched', {
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
    await logger.error('linkedin_analytics_error', 'Failed to fetch post analytics', {
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
 * Get connections
 */
export async function getConnections(
  userId: string,
  maxResults: number = 50
): Promise<{ success: boolean; connections?: any[]; error?: string }> {
  try {
    const client = getComposioClient();

    const result = await client.tools.execute('LINKEDIN_GET_CONNECTIONS', {
      userId,
      arguments: { limit: maxResults },
    });

    const connectionsData = result.data as any;
    const connections = connectionsData?.connections || connectionsData?.data || [];

    await logger.info('linkedin_connections', 'Connections fetched', {
      userId,
      count: connections.length,
    });

    return {
      success: true,
      connections,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await logger.error('linkedin_connections_error', 'Failed to fetch connections', {
      userId,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
    };
  }
}
