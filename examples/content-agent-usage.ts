/**
 * Example: Using the Content Agent Programmatically
 *
 * This shows different ways to integrate the Content Agent
 * into your application.
 */

import { getContentAgent, ContentGenerationRequest } from '@/lib/agents';

/**
 * Example 1: Direct Agent Usage (Backend)
 * Use this in API routes or server functions
 */
export async function example1_directUsage() {
  const userId = 'user-123';
  const agent = getContentAgent(userId);

  const result = await agent.generateContent({
    userId,
    brief: 'Announcing our new AI social media manager platform',
    toolkits: ['twitter', 'reddit'],
    tone: 'professional',
    additionalContext: 'Focus on productivity gains',
  });

  console.log('Generated Content:');
  console.log('Twitter:', result.twitter);
  console.log('Reddit:', result.reddit);
  console.log('Analysis:', result.analysis);
  console.log('Tokens Used:', result.metadata.tokensUsed);

  return result;
}

/**
 * Example 2: In a Campaign Creation Flow
 * Generate content as part of creating a new campaign
 */
export async function example2_campaignGeneration(
  userId: string,
  campaignBrief: string,
  targetPlatforms: string[]
) {
  const agent = getContentAgent(userId);

  try {
    const contentResult = await agent.generateContent({
      userId,
      brief: campaignBrief,
      toolkits: targetPlatforms as any,
      tone: 'professional',
    });

    // Save to database
    // const campaign = await supabase
    //   .from('campaigns')
    //   .insert({
    //     user_id: userId,
    //     title: campaignBrief,
    //     content: contentResult,
    //     status: 'draft',
    //   });

    return contentResult;
  } catch (error) {
    console.error('Campaign generation failed:', error);
    throw error;
  }
}

/**
 * Example 3: Batch Content Generation
 * Generate multiple content variations
 */
export async function example3_batchGeneration(
  userId: string,
  briefs: string[],
  platforms: string[]
) {
  const agent = getContentAgent(userId);
  const results = [];

  for (const brief of briefs) {
    try {
      const result = await agent.generateContent({
        userId,
        brief,
        toolkits: platforms as any,
        tone: 'casual',
      });
      results.push({ brief, result, status: 'success' });
    } catch (error) {
      results.push({
        brief,
        error: error instanceof Error ? error.message : String(error),
        status: 'failed',
      });
    }
  }

  return results;
}

/**
 * Example 4: In an API Route Handler
 * Integrate with Next.js API routes
 */
export async function example4_apiRouteHandler(
  userId: string,
  requestBody: {
    brief: string;
    toolkits: string[];
    tone?: 'professional' | 'casual' | 'humorous';
  }
) {
  const agent = getContentAgent(userId);

  try {
    const result = await agent.generateContent({
      userId,
      brief: requestBody.brief,
      toolkits: requestBody.toolkits as any,
      tone: requestBody.tone || 'professional',
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Example 5: With Custom Tool Integration (Future)
 * When extending to use Composio tools
 */
export async function example5_withToolIntegration(
  userId: string,
  brief: string,
  platforms: string[]
) {
  const agent = getContentAgent(userId);

  // 1. Generate content
  const contentResult = await agent.generateContent({
    userId,
    brief,
    toolkits: platforms as any,
    tone: 'professional',
  });

  // 2. In the future: Use Composio tools to post
  // const composioService = new ComposioIntegrationService(userId);
  // for (const platform of platforms) {
  //   await composioService.postContent({
  //     platform,
  //     content: contentResult[platform as keyof typeof contentResult],
  //     status: 'scheduled',
  //   });
  // }

  return contentResult;
}

/**
 * Example 6: Error Handling Best Practices
 */
export async function example6_errorHandling(userId: string, brief: string) {
  const agent = getContentAgent(userId);

  try {
    const result = await agent.generateContent({
      userId,
      brief,
      toolkits: ['twitter', 'reddit'],
      tone: 'professional',
    });

    // Success
    console.log('Content generated successfully');
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('MISTRAL_API_KEY')) {
        // API key missing
        console.error('Mistral API key not configured');
        return { success: false, error: 'API configuration error' };
      } else if (error.message.includes('API error')) {
        // API request failed
        console.error('Mistral API request failed');
        return { success: false, error: 'API request failed' };
      }
    }

    // Generic error
    console.error('Unexpected error:', error);
    return { success: false, error: 'Content generation failed' };
  }
}

/**
 * Example 7: Testing the Content Agent
 * Unit test example
 */
export async function example7_testContentAgent() {
  const testUserId = 'test-user-123';
  const testBrief = 'Test brief for content generation';

  try {
    const agent = getContentAgent(testUserId);
    const result = await agent.generateContent({
      userId: testUserId,
      brief: testBrief,
      toolkits: ['twitter'],
      tone: 'professional',
    });

    // Assertions
    if (!result.twitter) throw new Error('No Twitter content generated');
    if (!result.metadata) throw new Error('No metadata returned');
    if (result.metadata.model !== 'mistral-large-latest')
      throw new Error('Unexpected model');

    console.log('✓ All tests passed');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}
