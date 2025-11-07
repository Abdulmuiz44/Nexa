import { Composio } from '@composio/core';

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

// Helper functions for social media operations
// Note: These are placeholder implementations until Composio API is properly configured
export const composioHelpers = {
  // Get available actions for a user
  getActions: async (userId: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Getting actions for user ${userId}`);
    return [];
  },

  // Execute an action
  executeAction: async (actionName: string, params: any, userId: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Executing action ${actionName} for user ${userId}`, params);
    return { success: true, data: 'Action simulated' };
  },

  // Check connection status
  getConnection: async (connectionId: string, userId: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Getting connection ${connectionId} for user ${userId}`);
    return { status: 'ACTIVE' };
  },

  // Initiate connection
  initiateConnection: async (appName: string, userId: string, redirectUri?: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Initiating connection to ${appName} for user ${userId}`);
    return { connectionId: 'mock-connection-id', authUrl: 'https://mock-auth-url.com' };
  },

  // Specific social media actions
  postToTwitter: async (content: string, userId: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Posting to Twitter for user ${userId}: ${content}`);
    return { success: true, postId: 'mock-tweet-id', url: 'https://twitter.com/mock/status/mock-tweet-id' };
  },

  postToReddit: async (subreddit: string, title: string, content: string, userId: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Posting to Reddit r/${subreddit} for user ${userId}: ${title}`);
    return { success: true, postId: 'mock-post-id', url: `https://reddit.com/r/${subreddit}/mock-post-id` };
  },

  getTwitterAnalytics: async (tweetId: string, userId: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Getting Twitter analytics for tweet ${tweetId} user ${userId}`);
    return { impressions: 100, engagements: 20, likes: 15, retweets: 5 };
  },

  getRedditAnalytics: async (postId: string, userId: string) => {
    // Placeholder - implement when Composio API is available
    console.log(`Getting Reddit analytics for post ${postId} user ${userId}`);
    return { score: 25, comments: 8, upvotes: 25, downvotes: 0 };
  },
};
