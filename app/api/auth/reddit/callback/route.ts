import { NextRequest, NextResponse } from 'next/server';
import Snoowrap from 'snoowrap';
import { supabaseServer } from '@/src/lib/supabaseServer';

const CLIENT_ID = process.env.REDDIT_CLIENT_ID!;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/reddit/callback`;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: `Reddit auth error: ${error}` }, { status: 400 });
    }

    if (!state || !code) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // 1. Verify State
    const { data: dbState, error: stateError } = await supabaseServer
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .single();

    if (stateError || !dbState) {
        return NextResponse.json({ error: 'Invalid or expired state' }, { status: 400 });
    }

    try {
        // 2. Exchange Code for Tokens
        const r = await Snoowrap.fromAuthCode({
            code,
            userAgent: process.env.REDDIT_USER_AGENT || 'nexa-app/1.0',
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            redirectUri: REDIRECT_URI
        }) as any;

        const user = await r.getMe() as any;
        const username = user.name;
        const userId = user.id;

        // 3. Save to Connected Accounts
        // Reddit access tokens expire in 1 hour usually, refresh token is permanent unless revoked
        const expiresIn = 3600;
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        const { error: saveError } = await supabaseServer
            .from('connected_accounts')
            .upsert({
                user_id: dbState.user_id,
                platform: 'reddit',
                platform_user_id: userId,
                username: username,
                access_token: r.accessToken,
                refresh_token: r.refreshToken,
                expires_at: expiresAt,
                scopes: ['identity', 'submit', 'read', 'mysubreddits'],
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, platform' });

        if (saveError) {
            console.error('Error saving account:', saveError);
            throw new Error('Failed to save account');
        }

        // 4. Cleanup State
        await supabaseServer.from('oauth_states').delete().eq('id', dbState.id);

        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/settings?connected=reddit`);

    } catch (err: any) {
        console.error('Reddit Auth Error:', err);
        return NextResponse.json({ error: 'Authentication failed', details: err.message }, { status: 500 });
    }
}
