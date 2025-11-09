import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { AutonomousAgentManager } from '@/src/services/autonomousAgent';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String((session.user as any).id);

    // Start the autonomous agent
    await AutonomousAgentManager.startAgent(userId);

    return NextResponse.json({
      success: true,
      message: 'Autonomous agent started successfully',
    });
  } catch (error: any) {
    console.error('Error starting autonomous agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String((session.user as any).id);

    // Stop the autonomous agent
    await AutonomousAgentManager.stopAgent(userId);

    return NextResponse.json({
      success: true,
      message: 'Autonomous agent stopped successfully',
    });
  } catch (error: any) {
    console.error('Error stopping autonomous agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop agent' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String((session.user as any).id);

    // Get agent status
    const agent = AutonomousAgentManager.getAgent(userId);
    const isRunning = agent !== undefined;

    return NextResponse.json({
      isRunning,
      status: isRunning ? 'active' : 'stopped',
    });
  } catch (error: any) {
    console.error('Error getting agent status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get agent status' },
      { status: 500 }
    );
  }
}
