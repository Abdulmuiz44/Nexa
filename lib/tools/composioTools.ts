/**
 * Composio Tool Definitions
 * Defines tools for posting to social media platforms via Composio
 */

import { ComposioIntegrationService } from '@/src/services/composioIntegration';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

export interface ComposioToolInput {
  userId: string;
  platform: 'twitter' | 'reddit' | 'linkedin';
  content: string;
  scheduledTime?: number; // Unix timestamp
  mediaUrls?: string[];
}

export interface ComposioToolOutput {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  message: string;
}

/**
 * Post to social media using Composio
 */
export async function postToSocialMedia(input: ComposioToolInput): Promise<ComposioToolOutput> {
  try {
    const { userId, platform, content, scheduledTime, mediaUrls } = input;

    const composioService = new ComposioIntegrationService(userId);

    await logger.info('composio_post', `Posting to ${platform}`, {
      userId,
      platform,
      contentLength: content.length,
      scheduled: !!scheduledTime,
    });

    let result;

    switch (platform) {
      case 'twitter':
        result = await composioService.postTweet(content, {
          scheduled_time: scheduledTime,
          media_urls: mediaUrls,
        });
        break;

      case 'reddit':
        // Reddit requires subreddit - would need to be enhanced
        result = await composioService.postToReddit(content, {
          subreddit: 'test', // Placeholder
          scheduled_time: scheduledTime,
        });
        break;

      case 'linkedin':
        result = await composioService.postToLinkedIn(content, {
          scheduled_time: scheduledTime,
          media_urls: mediaUrls,
        });
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    await logger.info('composio_post_success', `Posted successfully to ${platform}`, {
      userId,
      platform,
      postId: result?.id,
    });

    return {
      success: true,
      postId: result?.id,
      url: result?.url,
      message: `Post published to ${platform}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('composio_post_error', `Failed to post to ${input.platform}`, {
      userId: input.userId,
      platform: input.platform,
      error: errorMsg,
    });

    return {
      success: false,
      error: errorMsg,
      message: `Failed to post to ${input.platform}: ${errorMsg}`,
    };
  }
}

/**
 * Fetch engagement metrics from social media
 */
export async function fetchEngagementMetrics(
  userId: string,
  platform: 'twitter' | 'reddit' | 'linkedin',
  postId: string
): Promise<{
  success: boolean;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  error?: string;
}> {
  try {
    const composioService = new ComposioIntegrationService(userId);

    await logger.info('composio_metrics', `Fetching metrics for ${postId} on ${platform}`, {
      userId,
      platform,
      postId,
    });

    // This is a placeholder - actual implementation would call Composio's metrics API
    const metrics = {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
    };

    return {
      success: true,
      metrics,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Schedule a post for later
 */
export async function schedulePost(input: ComposioToolInput): Promise<ComposioToolOutput> {
  if (!input.scheduledTime) {
    return {
      success: false,
      error: 'scheduledTime is required for scheduling posts',
      message: 'scheduledTime is required',
    };
  }

  // Delegate to postToSocialMedia with scheduled time
  return postToSocialMedia(input);
}

/**
 * Get Composio tool schemas for LangGraph
 */
export function getComposioToolSchemas() {
  return [
    {
      type: 'function',
      function: {
        name: 'post_to_social_media',
        description: 'Post content to a social media platform (Twitter, Reddit, LinkedIn)',
        parameters: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
            },
            platform: {
              type: 'string',
              enum: ['twitter', 'reddit', 'linkedin'],
              description: 'Social media platform',
            },
            content: {
              type: 'string',
              description: 'Content to post',
            },
            scheduledTime: {
              type: 'number',
              description: 'Unix timestamp for scheduled posting (optional)',
            },
            mediaUrls: {
              type: 'array',
              items: { type: 'string' },
              description: 'URLs of media to attach (optional)',
            },
          },
          required: ['userId', 'platform', 'content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'fetch_engagement_metrics',
        description: 'Fetch engagement metrics for a posted item',
        parameters: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
            },
            platform: {
              type: 'string',
              enum: ['twitter', 'reddit', 'linkedin'],
              description: 'Social media platform',
            },
            postId: {
              type: 'string',
              description: 'Post ID',
            },
          },
          required: ['userId', 'platform', 'postId'],
        },
      },
    },
  ];
}

/**
 * Execute Composio tool call
 */
export async function executeComposioTool(
  toolName: string,
  toolInput: Record<string, any>
): Promise<ComposioToolOutput | { success: boolean; metrics?: any; error?: string }> {
  switch (toolName) {
    case 'post_to_social_media':
      return postToSocialMedia(toolInput as ComposioToolInput);

    case 'fetch_engagement_metrics':
      return fetchEngagementMetrics(toolInput.userId, toolInput.platform, toolInput.postId);

    case 'schedule_post':
      return schedulePost(toolInput as ComposioToolInput);

    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
        message: `Unknown tool: ${toolName}`,
      };
  }
}
