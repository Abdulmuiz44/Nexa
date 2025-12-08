import { Composio } from '@composio/core';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;

// Do not throw at import time in dev; it can break the app and cause cascading errors.
// Instead, instantiate only when the key exists and keep helpers as no-ops otherwise.
let composio: Composio | undefined;
if (!COMPOSIO_API_KEY) {
  if (typeof console !== 'undefined') {
    console.warn('COMPOSIO_API_KEY is not set; Composio features will be disabled.');
  }
} else {
  composio = new Composio({ apiKey: COMPOSIO_API_KEY });
}

export { composio };

// Helper functions for social media operations using ComposioIntegrationService
export const composioHelpers = {
  // Get available actions for a user
  getActions: async (userId: string) => {
    try {
      if (!composio) {
        console.warn('Composio not initialized - returning empty actions');
        return [];
      }
      const service = new ComposioIntegrationService(userId);
      // Return available actions based on connected accounts
      return [];
    } catch (error) {
      console.error('Error getting actions:', error);
      return [];
    }
  },

  // Execute an action
  executeAction: async (actionName: string, params: any, userId: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const result = await service.executeAction(actionName, params);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error executing action:', error);
      throw error;
    }
  },

  // Check connection status
  getConnection: async (platform: string, userId: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const connection = await service.getConnection(platform as 'twitter' | 'reddit');
      return connection;
    } catch (error) {
      console.error('Error getting connection:', error);
      return null;
    }
  },

  // Initiate connection
  initiateConnection: async (appName: string, userId: string, redirectUri?: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      if (appName === 'twitter') {
        return await service.initiateTwitterConnection(redirectUri);
      } else if (appName === 'reddit') {
        return await service.initiateRedditConnection(redirectUri);
      }
      throw new Error(`Unsupported platform: ${appName}`);
    } catch (error) {
      console.error('Error initiating connection:', error);
      throw error;
    }
  },

  // Specific social media actions
  postToTwitter: async (content: string, userId: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const result = await service.postTweet({ content });
      const tweetId = result.tweetId || (result as any).id;
      return {
        success: true,
        postId: tweetId || 'unknown',
        url: result.url || (tweetId ? `https://twitter.com/${userId}/status/${tweetId}` : undefined),
        data: result,
      };
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      throw error;
    }
  },

  postToReddit: async (subreddit: string, title: string, content: string, userId: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const result = await service.postToReddit({ subreddit, title, content });
      return {
        success: true,
        postId: result.postId || (result as any).id || 'unknown',
        url: result.url || `https://reddit.com/r/${subreddit}`,
        data: result,
      };
    } catch (error) {
      console.error('Error posting to Reddit:', error);
      throw error;
    }
  },

  getTwitterAnalytics: async (tweetId: string, userId: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const result = await service.getTweetAnalytics(tweetId);
      return result;
    } catch (error) {
      console.error('Error getting Twitter analytics:', error);
      return { impressions: 0, engagements: 0, likes: 0, retweets: 0 };
    }
  },

  getRedditAnalytics: async (postId: string, userId: string) => {
    try {
      // Placeholder for Reddit analytics
      console.log(`Getting Reddit analytics for post ${postId} user ${userId}`);
      return { score: 0, comments: 0, upvotes: 0, downvotes: 0 };
    } catch (error) {
      console.error('Error getting Reddit analytics:', error);
      return { score: 0, comments: 0, upvotes: 0, downvotes: 0 };
    }
  },

  // New helper methods for enhanced chat integration
  getTwitterTimeline: async (userId: string, maxResults: number = 20) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const tweets = await service.getUserTimeline(maxResults);
      return tweets;
    } catch (error) {
      console.error('Error getting Twitter timeline:', error);
      return [];
    }
  },

  searchUserTweets: async (userId: string, query: string, maxResults: number = 20) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const tweets = await service.searchUserTweets(query, maxResults);
      return tweets;
    } catch (error) {
      console.error('Error searching tweets:', error);
      return [];
    }
  },

  engageWithTweet: async (userId: string, tweetId: string, type: 'like' | 'retweet' | 'reply', replyContent?: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const result = await service.autoEngageWithTweet(tweetId, type, replyContent);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error engaging with tweet:', error);
      throw error;
    }
  },

  analyzeTweet: async (userId: string, content: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const analysis = await service.analyzeTweet(content);
      return analysis;
    } catch (error) {
      console.error('Error analyzing tweet:', error);
      throw error;
    }
  },

  generateTweet: async (userId: string, topic: string, context?: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const tweet = await service.generateTweetInUserStyle(topic, context);
      return tweet;
    } catch (error) {
      console.error('Error generating tweet:', error);
      throw error;
    }
  },

  analyzeTweetPatterns: async (userId: string) => {
    try {
      const service = new ComposioIntegrationService(userId);
      const patterns = await service.analyzeUserTweetPatterns();
      return patterns;
    } catch (error) {
      console.error('Error analyzing tweet patterns:', error);
      throw error;
    }
  },
};
