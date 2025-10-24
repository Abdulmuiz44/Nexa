import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NexaAgentFactory } from '@/src/services/nexaAgent';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, topic, count = 1, scheduledTime } = await req.json();

    if (!platform || !['twitter', 'reddit'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform. Must be twitter or reddit.' }, { status: 400 });
    }

    // Create agent instance
    const agent = await NexaAgentFactory.createAgent(session.user.id);
    if (!agent) {
      return NextResponse.json({ error: 'Unable to initialize agent. Please complete onboarding.' }, { status: 400 });
    }

    if (count > 1) {
      // Generate multiple posts
      const contents = await agent.generateContentSeries(count, platform, topic);
      return NextResponse.json({
        success: true,
        contents,
        count: contents.length,
      });
    } else {
      // Generate single post
      const result = await agent.generateAndSchedulePost({
        platform,
        topic,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          post: result.post,
          scheduled: result.scheduled,
        });
      } else {
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
      }
    }
  } catch (error: unknown) {
    console.error('Content generation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate content'
    }, { status: 500 });
  }
}
