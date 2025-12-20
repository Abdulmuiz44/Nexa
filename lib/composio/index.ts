/**
 * Composio Client Initialization
 * Central client for all Composio toolkit integrations
 */

import { Composio } from '@composio/core';

let composioInstance: Composio | null = null;

/**
 * Get or create Composio instance
 */
export function getComposioClient(): Composio {
  if (!composioInstance) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      throw new Error('COMPOSIO_API_KEY environment variable is not set');
    }
    composioInstance = new Composio({ apiKey });
  }
  return composioInstance;
}

/**
 * Check if Composio is available
 */
export function isComposioAvailable(): boolean {
  return !!process.env.COMPOSIO_API_KEY;
}

/**
 * List all available toolkits/apps
 */
export async function listAvailableToolkits(): Promise<string[]> {
  if (!isComposioAvailable()) {
    return [];
  }
  try {
    const client = getComposioClient();
    // This would list all available apps in Composio
    return ['twitter', 'reddit', 'linkedin', 'email', 'slack'];
  } catch (error) {
    console.error('Error listing toolkits:', error);
    return [];
  }
}

/**
 * Get toolkit documentation
 */
export function getToolkitDocs(toolkit: string): Record<string, any> {
  const docs: Record<string, any> = {
    twitter: {
      name: 'Twitter/X',
      url: 'https://docs.composio.dev/toolkits/twitter',
      actions: [
        'TWITTER_CREATION_OF_A_POST',
        'TWITTER_LIKE_A_POST',
        'TWITTER_RETWEET',
        'TWITTER_GET_USER_TWEETS',
        'TWITTER_GET_HOME_TIMELINE',
      ],
    },
    reddit: {
      name: 'Reddit',
      url: 'https://docs.composio.dev/toolkits/reddit',
      actions: [
        'REDDIT_SUBMIT_TEXT_POST',
        'REDDIT_SUBMIT_LINK_POST',
        'REDDIT_POST_COMMENT',
      ],
    },
    linkedin: {
      name: 'LinkedIn',
      url: 'https://docs.composio.dev/toolkits/linkedin',
      actions: [
        'LINKEDIN_POST_CREATION',
        'LINKEDIN_GET_CONNECTIONS',
      ],
    },
  };

  return docs[toolkit] || { name: toolkit, url: `https://docs.composio.dev/toolkits/${toolkit}` };
}
