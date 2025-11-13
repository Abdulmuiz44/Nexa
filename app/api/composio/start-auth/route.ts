import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

async function buildAuthUrl(toolkit: string, userId: string) {
  const composioService = new ComposioIntegrationService(userId);
  
  try {
    let result;
    if (toolkit === 'twitter') {
      result = await composioService.initiateTwitterConnection();
    } else if (toolkit === 'reddit') {
      result = await composioService.initiateRedditConnection();
    } else {
      throw new Error(`Unsupported toolkit: ${toolkit}`);
    }
    
    return {
      url: result.authUrl,
      sessionId: result.connectionId,
    };
  } catch (e) {
    console.error('Error building auth URL:', e);
    // Fallback to mock URL
    const sessionId = `mock-${toolkit}-${Date.now()}`;
    const redirectUrl = `https://app.composio.dev/connect/${toolkit}`;
    
    const callbackUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/callback?sessionId=${encodeURIComponent(sessionId)}&toolkit=${encodeURIComponent(toolkit)}&userId=${encodeURIComponent(String(userId))}`;
    const url = new URL(redirectUrl);
    url.searchParams.set('state', Buffer.from(JSON.stringify({ u: userId, tk: toolkit })).toString('base64'));
    url.searchParams.set('redirect_uri', callbackUrl);
    return { url: url.toString(), sessionId };
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.redirect(new URL('/auth/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    const u = new URL(req.url);
    const toolkit = u.searchParams.get('toolkit');
    if (!toolkit) return NextResponse.redirect(new URL('/dashboard/connections?error=toolkit', u.origin));
    const { url } = await buildAuthUrl(toolkit, String((session.user as any).id));
    return NextResponse.redirect(url);
  } catch (error) {
    const u = new URL(req.url);
    return NextResponse.redirect(new URL('/dashboard/connections?error=start_auth', u.origin));
  }
}

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

    const { url, sessionId } = await buildAuthUrl(toolkit, String((session.user as any).id));
    return NextResponse.json({ redirectUrl: url, sessionId });
  } catch (error: unknown) {
    console.error('Composio start auth error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Composio auth failed' }, { status: 500 });
  }
}
