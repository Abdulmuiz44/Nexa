import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { composio } from '@/lib/composio';

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

    const authSession = await composio.authSessions.create({
      appName: toolkit,
      userId: session.user.id,
    });

    return NextResponse.json({
      redirectUrl: authSession.redirectUrl,
      sessionId: authSession.id,
    });
  } catch (error: any) {
    console.error('Composio start auth error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
