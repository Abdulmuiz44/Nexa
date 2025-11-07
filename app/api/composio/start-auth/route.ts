import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { toolkit } = await req.json();
    if (!toolkit) {
      return NextResponse.json({ error: 'Toolkit required' }, { status: 400 });
    }

    // Placeholder auth session
    const authSession = {
      redirectUrl: `https://composio.ai/auth/${toolkit}`,
      id: `mock-${toolkit}-${Date.now()}`,
    };

    return NextResponse.json({
      redirectUrl: authSession.redirectUrl,
      sessionId: authSession.id,
      // Client should later POST to /api/composio/callback with { sessionId, userId: session.user.id, toolkit }
    });
  } catch (error: unknown) {
    console.error('Composio start auth error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Composio auth failed' }, { status: 500 });
  }
}
