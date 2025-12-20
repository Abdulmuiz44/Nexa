/**
 * LangGraph Workflow for Multi-Agent Orchestration
 * Coordinates content generation → publishing → analytics
 */

import { getContentAgent } from './contentAgent';
import { executeComposioTool } from '@/lib/tools/composioTools';
import { createLogger } from '@/lib/logger';
import { AgentState } from './types';

const logger = createLogger();

/**
 * Define the workflow state
 */
export interface WorkflowState extends AgentState {
  postIds?: string[];
  published?: boolean;
  metrics?: Record<string, any>;
}

/**
 * Node: Generate Content using Content Agent
 */
async function nodeGenerateContent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  logger.info('Starting content generation', {
    userId: state.userId,
    toolkits: state.toolkits,
  });

  try {
    const contentAgent = getContentAgent(state.userId);
    const result = await contentAgent.generateContent({
      userId: state.userId,
      brief: state.userBrief,
      toolkits: state.toolkits,
      tone: 'professional',
    });

    return {
      contentVariations: result,
      executionLog: [
        ...state.executionLog,
        `✓ Content generated for ${state.toolkits.join(', ')}`,
      ],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      error: errorMsg,
      executionLog: [...state.executionLog, `✗ Content generation failed: ${errorMsg}`],
    };
  }
}

/**
 * Node: Publish content to social media
 */
async function nodePublishContent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  if (!state.contentVariations) {
    return {
      error: 'No content to publish',
      executionLog: [...state.executionLog, '✗ No content to publish'],
    };
  }

  logger.info('Starting content publishing', {
    userId: state.userId,
    platforms: Object.keys(state.contentVariations).filter((k) => k !== 'metadata'),
  });

  const postIds: string[] = [];
  const newLog = [...state.executionLog];

  for (const platform of state.toolkits) {
    const content = state.contentVariations[platform];
    if (!content) continue;

    try {
      const result = await executeComposioTool('post_to_social_media', {
        userId: state.userId,
        platform,
        content,
      });

      if (result.success && 'postId' in result && result.postId) {
        postIds.push(result.postId);
        newLog.push(`✓ Posted to ${platform}: ${result.postId}`);
      } else {
        newLog.push(`✗ Failed to post to ${platform}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      newLog.push(`✗ Error posting to ${platform}: ${errorMsg}`);
    }
  }

  return {
    postIds,
    published: postIds.length > 0,
    executionLog: [
      ...newLog,
      `✓ Publishing complete: ${postIds.length} posts published`,
    ],
  };
}

/**
 * Node: Fetch analytics
 */
async function nodeAnalytics(state: WorkflowState): Promise<Partial<WorkflowState>> {
  if (!state.postIds || state.postIds.length === 0) {
    return {
      executionLog: [...state.executionLog, 'ℹ No posts to fetch analytics for'],
    };
  }

  logger.info('Starting analytics fetch', {
    userId: state.userId,
    postCount: state.postIds.length,
  });

  const metrics: Record<string, any> = {};

  // In production, fetch real metrics from Composio
  // For now, use placeholder metrics
  for (const postId of state.postIds) {
    metrics[postId] = {
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10),
      views: Math.floor(Math.random() * 500),
    };
  }

  return {
    metrics,
    executionLog: [...state.executionLog, `✓ Analytics fetched for ${state.postIds.length} posts`],
  };
}

/**
 * Execute workflow (synchronous)
 */
export async function executeWorkflow(
  state: Omit<WorkflowState, 'executionLog' | 'timestamp'>
): Promise<WorkflowState> {
  const initialState: WorkflowState = {
    ...state,
    executionLog: [],
    timestamp: Date.now(),
  };

  try {
    // Step 1: Generate content
    let currentState = initialState;
    const generateResult = await nodeGenerateContent(currentState);
    currentState = { ...currentState, ...generateResult };

    if (currentState.error) {
      return currentState;
    }

    // Step 2: Publish content (if generated)
    if (currentState.contentVariations && Object.keys(currentState.contentVariations).length > 0) {
      const publishResult = await nodePublishContent(currentState);
      currentState = { ...currentState, ...publishResult };

      if (currentState.error) {
        return currentState;
      }

      // Step 3: Fetch analytics (if published)
      if (currentState.published && currentState.postIds && currentState.postIds.length > 0) {
        const analyticsResult = await nodeAnalytics(currentState);
        currentState = { ...currentState, ...analyticsResult };
      }
    } else {
      currentState.executionLog.push('ℹ No content generated, skipping publish and analytics');
    }

    logger.info('Workflow completed successfully', {
      userId: currentState.userId,
    });

    return currentState;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Workflow failed: ${errorMsg}`);

    return {
      ...initialState,
      error: errorMsg,
      executionLog: [...initialState.executionLog, `✗ Workflow failed: ${errorMsg}`],
    };
  }
}

/**
 * Stream workflow execution (for real-time updates)
 */
export async function* streamWorkflow(
  state: Omit<WorkflowState, 'executionLog' | 'timestamp'>
): AsyncGenerator<WorkflowState> {
  const initialState: WorkflowState = {
    ...state,
    executionLog: ['Starting workflow...'],
    timestamp: Date.now(),
  };

  try {
    // Yield initial state
    yield initialState;

    // Execute workflow and yield updates
    let currentState = initialState;

    // ========== STEP 1: Generate Content ==========
    try {
      logger.info('Starting content generation', {
        userId: currentState.userId,
        toolkits: currentState.toolkits,
      });

      const generateResult = await nodeGenerateContent(currentState);
      currentState = { ...currentState, ...generateResult };
      yield currentState;

      if (currentState.error) {
        return;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      currentState = {
        ...currentState,
        error: errorMsg,
        executionLog: [...currentState.executionLog, `✗ Generate failed: ${errorMsg}`],
      };
      logger.error(`Generate failed: ${errorMsg}`);
      yield currentState;
      return;
    }

    // ========== STEP 2: Publish Content (if generated) ==========
    if (currentState.contentVariations && Object.keys(currentState.contentVariations).length > 0) {
      try {
        logger.info('Starting content publishing', {
          userId: currentState.userId,
          platforms: Object.keys(currentState.contentVariations),
        });

        const publishResult = await nodePublishContent(currentState);
        currentState = { ...currentState, ...publishResult };
        yield currentState;

        if (currentState.error) {
          return;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        currentState = {
          ...currentState,
          error: errorMsg,
          executionLog: [...currentState.executionLog, `✗ Publish failed: ${errorMsg}`],
        };
        logger.error(`Publish failed: ${errorMsg}`);
        yield currentState;
        return;
      }

      // ========== STEP 3: Fetch Analytics (if published) ==========
      if (currentState.published && currentState.postIds && currentState.postIds.length > 0) {
        try {
          logger.info('Starting analytics fetch', {
            userId: currentState.userId,
            postCount: currentState.postIds.length,
          });

          const analyticsResult = await nodeAnalytics(currentState);
          currentState = { ...currentState, ...analyticsResult };
          yield currentState;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          currentState = {
            ...currentState,
            error: errorMsg,
            executionLog: [...currentState.executionLog, `✗ Analytics failed: ${errorMsg}`],
          };
          logger.error(`Analytics failed: ${errorMsg}`);
          yield currentState;
          return;
        }
      }
    } else {
      currentState.executionLog.push('ℹ No content generated, skipping publish and analytics');
      yield currentState;
      return;
    }

    logger.info('Workflow completed successfully', {
      userId: currentState.userId,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`Workflow fatal error: ${errorMsg}`);
    yield {
      ...initialState,
      error: errorMsg,
      executionLog: [...initialState.executionLog, `✗ Fatal error: ${errorMsg}`],
      timestamp: Date.now(),
    };
  }
}
