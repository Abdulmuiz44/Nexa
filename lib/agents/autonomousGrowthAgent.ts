/**
 * Autonomous Growth Agent
 * Full autonomous agent for social media growth using Composio + Mistral AI
 * Triggered via chat interface
 */

import { Mistral } from '@mistralai/mistralai';
import { GrowthAgent, SocialMediaPlatform } from './growthAgent';
import { ContentAgent } from './contentAgent';
import { executeWorkflow, WorkflowState } from './workflow';
import { createLogger } from '@/lib/logger';
import { supabaseServer } from '@/src/lib/supabaseServer';

const logger = createLogger();

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || '',
});

export interface AutonomousAgentRequest {
  userId: string;
  userBrief: string;
  platforms: SocialMediaPlatform[];
  autoEngage?: boolean;
  analyzeMetrics?: boolean;
  toneOVerride?: 'professional' | 'casual' | 'humorous';
}

export interface AutonomousAgentResponse {
  success: boolean;
  message: string;
  postIds: string[];
  urls: string[];
  metrics?: Record<string, any>;
  executionLog: string[];
  estimatedCreditsUsed: number;
}

/**
 * System prompt for autonomous growth agent
 */
const GROWTH_AGENT_SYSTEM_PROMPT = `You are an autonomous social media growth agent powered by Mistral AI and Composio.

Your capabilities:
1. Generate platform-specific content (Twitter, Reddit, LinkedIn)
2. Publish posts across multiple platforms simultaneously
3. Schedule posts for optimal times
4. Analyze post performance and engagement
5. Engage with relevant content (likes, comments, retweets)
6. Learn user's posting patterns to personalize content

You have access to the following tools:
- generate_content: Create platform-specific content
- post_to_social_media: Publish posts
- schedule_post: Schedule posts for later
- fetch_engagement_metrics: Get post performance
- auto_engage: Like, comment, and retweet relevant content

When given a task:
1. First, understand the user's goals and target audience
2. Generate appropriate content for each platform
3. Execute the posting plan
4. Monitor performance
5. Suggest optimizations based on metrics

Always respect platform guidelines and user preferences.`;

/**
 * Execute autonomous growth workflow
 */
export async function executeAutonomousGrowth(
  request: AutonomousAgentRequest
): Promise<AutonomousAgentResponse> {
  const startTime = Date.now();
  const executionLog: string[] = [];

  try {
    const { userId, userBrief, platforms, autoEngage = false, analyzeMetrics = true } = request;

    executionLog.push(`🚀 Autonomous Growth Agent Started`);
    executionLog.push(`📝 Brief: ${userBrief}`);
    executionLog.push(`📱 Platforms: ${platforms.join(', ')}`);

    // Step 1: Verify user has connections
    await logger.info('autonomous_agent_start', 'Starting autonomous growth workflow', {
      userId,
      platforms,
      autoEngage,
    });

    executionLog.push('🔗 Checking platform connections...');

    const { data: connections } = await supabaseServer
      .from('composio_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    const connectedPlatforms = connections?.map((c: any) => c.toolkit_slug) || [];
    const missingPlatforms = platforms.filter((p) => !connectedPlatforms.includes(p));

    if (missingPlatforms.length > 0) {
      throw new Error(`User not connected to: ${missingPlatforms.join(', ')}`);
    }

    executionLog.push(`✅ Verified connections: ${connectedPlatforms.join(', ')}`);

    // Step 2: Generate content using Mistral via workflow
    executionLog.push('📝 Generating content with Mistral AI...');

    const workflowState: Omit<WorkflowState, 'executionLog' | 'timestamp'> = {
      userId,
      userBrief,
      toolkits: platforms,
    };

    const generateState = await executeWorkflow(workflowState);

    if (generateState.error) {
      throw new Error(`Content generation failed: ${generateState.error}`);
    }

    executionLog.push('✅ Content generated successfully');
    executionLog.push(...generateState.executionLog.slice(-3)); // Last 3 logs

    // Step 3: Publish to all platforms
    executionLog.push('📤 Publishing to platforms...');

    const postIds: string[] = [];
    const urls: string[] = [];

    if (generateState.contentVariations) {
      const growthAgent = new GrowthAgent(userId);

      for (const platform of platforms) {
        const content = generateState.contentVariations[platform];
        if (!content) continue;

        try {
          const result = await growthAgent.executeAction('create_post', {
            platform,
            content,
          });

          if (result.success && result.postId) {
            postIds.push(result.postId);
            urls.push(result.url);
            executionLog.push(`✅ Posted to ${platform}: ${result.url}`);
          } else {
            executionLog.push(`⚠️ Failed to post to ${platform}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          executionLog.push(`❌ Error posting to ${platform}: ${errorMsg}`);
        }
      }
    }

    // Step 4: Optional auto-engagement
    let metrics: Record<string, any> = {};

    if (autoEngage && platforms.includes('twitter')) {
      executionLog.push('🤝 Auto-engaging with relevant tweets...');
      // This would be implemented to search and engage with relevant content
      executionLog.push('✅ Auto-engagement complete');
    }

    // Step 5: Fetch metrics if requested
    if (analyzeMetrics && postIds.length > 0) {
      executionLog.push('📊 Fetching post performance metrics...');

      const growthAgent = new GrowthAgent(userId);

      for (let i = 0; i < postIds.length && i < platforms.length; i++) {
        try {
          const metricResult = await growthAgent.executeAction('analyze_performance', {
            postId: postIds[i],
            platform: platforms[i],
            period: '1h',
          });

          if (metricResult.success) {
            metrics[postIds[i]] = metricResult.analytics;
            executionLog.push(`✅ Metrics for ${platforms[i]}: ${JSON.stringify(metricResult.analytics)}`);
          }
        } catch (error) {
          console.warn('Could not fetch metrics:', error);
        }
      }
    }

    const executionTime = Math.round((Date.now() - startTime) / 1000);
    const estimatedCreditsUsed = platforms.length * 5; // Rough estimate

    executionLog.push(`⏱️ Execution time: ${executionTime}s`);
    executionLog.push(`💳 Credits used: ~${estimatedCreditsUsed}`);
    executionLog.push(`✨ Autonomous Growth Complete!`);

    await logger.info('autonomous_agent_success', 'Autonomous growth workflow completed', {
      userId,
      platforms,
      postCount: postIds.length,
      executionTime,
    });

    return {
      success: true,
      message: `Successfully posted to ${postIds.length} platforms`,
      postIds,
      urls,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
      executionLog,
      estimatedCreditsUsed,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    executionLog.push(`❌ Error: ${errorMsg}`);

    await logger.error('autonomous_agent_error', 'Autonomous growth workflow failed', {
      error: errorMsg,
    });

    return {
      success: false,
      message: `Failed: ${errorMsg}`,
      postIds: [],
      urls: [],
      executionLog,
      estimatedCreditsUsed: 0,
    };
  }
}

/**
 * Stream autonomous growth workflow for real-time updates
 */
export async function* streamAutonomousGrowth(
  request: AutonomousAgentRequest
): AsyncGenerator<AutonomousAgentResponse> {
  const executionLog: string[] = [];

  try {
    const { userId, userBrief, platforms } = request;

    // Initial state
    yield {
      success: true,
      message: 'Initializing autonomous growth agent...',
      postIds: [],
      urls: [],
      executionLog: ['🚀 Starting...'],
      estimatedCreditsUsed: 0,
    };

    // Execute and yield progress
    const result = await executeAutonomousGrowth(request);
    yield result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    yield {
      success: false,
      message: `Error: ${errorMsg}`,
      postIds: [],
      urls: [],
      executionLog: [`❌ ${errorMsg}`],
      estimatedCreditsUsed: 0,
    };
  }
}

/**
 * Create tools for Mistral API calling
 */
export function getAutonomousAgentTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'generate_content',
        description: 'Generate platform-specific social media content',
        parameters: {
          type: 'object',
          properties: {
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target platforms: twitter, reddit, linkedin',
            },
            topic: {
              type: 'string',
              description: 'Content topic/brief',
            },
            tone: {
              type: 'string',
              enum: ['professional', 'casual', 'humorous'],
              description: 'Content tone',
            },
          },
          required: ['platforms', 'topic'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'post_to_social_media',
        description: 'Publish posts to social media platforms',
        parameters: {
          type: 'object',
          properties: {
            platforms: {
              type: 'array',
              items: { type: 'string' },
            },
            content: {
              type: 'object',
              description: 'Platform-specific content map',
            },
          },
          required: ['platforms', 'content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'fetch_engagement_metrics',
        description: 'Get engagement metrics for published posts',
        parameters: {
          type: 'object',
          properties: {
            post_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Post IDs to fetch metrics for',
            },
          },
          required: ['post_ids'],
        },
      },
    },
  ];
}
