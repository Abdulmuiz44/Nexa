import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import composio from '@/lib/composioClient';

export async function POST(req: NextRequest) {
  const { platform } = await req.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const connection = await composio.integrations.initiate({
      appName: platform === 'twitter' ? 'twitter' : 'reddit',
      authMode: 'oauth2',
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/connections`,
    });

    // Save to oauth_states
    await supabase.from('oauth_states').insert({
      state: connection.state,
      user_id: userId,
      platform: platform === 'twitter' ? 'twitter' : 'reddit',
      redirect_uri: connection.redirectUri,
    });

    return NextResponse.json({ url: connection.redirectUrl });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
