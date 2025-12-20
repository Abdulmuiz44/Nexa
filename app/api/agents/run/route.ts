import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContentAgent } from '@/lib/agents/contentAgent';
import { ContentGenerationRequest } from '@/lib/agents/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

/**
 * POST /api/agents/run
 * Trigger content agent to generate social media content
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { brief, toolkits, tone, additionalContext } = body;

    // Validate inputs
    if (!brief || !toolkits || !Array.isArray(toolkits) || toolkits.length === 0) {
      return NextResponse.json(
        {
          error: 'Missing or invalid parameters: brief and toolkits (non-empty array) are required',
        },
        { status: 400 }
      );
    }

    // Create request
    const contentRequest: ContentGenerationRequest = {
      userId: session.user.id,
      brief,
      toolkits,
      tone: (tone as 'professional' | 'casual' | 'humorous') || 'professional',
      additionalContext,
    };

    // Log request
    await logger.info('api_request', 'Content generation request received', {
      userId: session.user.id,
      toolkits,
      briefLength: brief.length,
    });

    // Initialize agent and generate content
    const agent = getContentAgent(session.user.id);
    const result = await agent.generateContent(contentRequest);

    // Log success
    await logger.info('api_success', 'Content generation completed', {
      userId: session.user.id,
      platforms: Object.keys(result).filter((k) => k !== 'metadata'),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('api_error', `Content generation failed: ${errorMsg}`, {
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Content generation failed',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/run
 * Get available agents and their capabilities
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agent = getContentAgent(session.user.id);

  return NextResponse.json({
    agents: [
      {
        name: 'content',
        description: 'Generate platform-specific social media content',
        capabilities: ['twitter', 'reddit', 'linkedin'],
        tools: agent.getToolSchemas(),
      },
    ],
  });
}
