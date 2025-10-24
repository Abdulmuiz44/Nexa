import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NexaAgentFactory } from '@/src/services/nexaAgent';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create agent instance
    const agent = await NexaAgentFactory.createAgent(session.user.id);
    if (!agent) {
      return NextResponse.json({
        error: 'Unable to create agent. Please complete onboarding first.'
      }, { status: 400 });
    }

    // Start the agent
    const result = await agent.startAgent();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        agentStatus: 'active'
      });
    } else {
      return NextResponse.json({
        error: result.message
      }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('Agent start error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to start agent'
    }, { status: 500 });
  }
}
