import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { supabaseServer } from '@/src/lib/supabaseServer';

const CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;

const getFallbackRedirectUri = (req: NextRequest) => {
    const url = new URL(req.url);
    let host = process.env.NEXTAUTH_URL;
    if (!host) {
        const protocol = url.host.includes('localhost') || url.host.includes('127.0.0.1') ? 'http:' : url.protocol;
        host = `${protocol}//${url.host}`;
    }
    return `${host.replace(/\/$/, '')}/api/auth/twitter/callback`;
};

const REDIRECT_URI_DEFAULT = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback` : '';

interface OAuthMetadata {
    codeVerifier?: string;
}

interface RedirectData {
    uri?: string;
    codeVerifier?: string;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    const code = searchParams.get('code');

    if (!state || !code) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // 1. Verify State & Get Verifier from DB
    const { data: dbState, error: stateError } = await supabaseServer
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .single();

    if (stateError || !dbState) {
        return NextResponse.json({ error: 'Invalid or expired state' }, { status: 400 });
    }

    // Try to get codeVerifier and redirectUri from metadata first, then from redirect_uri JSON fallback
    let codeVerifier: string | undefined;
    let redirectUri = getFallbackRedirectUri(req);

    const metadata = dbState.metadata as OAuthMetadata | null;
    if (metadata?.codeVerifier) {
        codeVerifier = metadata.codeVerifier;
    }

    if (dbState.redirect_uri) {
        // Try to parse redirect_uri as JSON (fallback storage)
        try {
            const redirectData = JSON.parse(dbState.redirect_uri) as RedirectData;
            if (redirectData.codeVerifier) codeVerifier = redirectData.codeVerifier;
            if (redirectData.uri) redirectUri = redirectData.uri;
        } catch (e) {
            // Not JSON, likely just a plain URI
            redirectUri = dbState.redirect_uri;
        }
    }

    if (!codeVerifier) {
        return NextResponse.json({ error: 'Missing code verifier' }, { status: 400 });
    }

    // 2. Exchange Code for Tokens
    const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

    try {
        const { client: loggedClient, accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri,
        });

        const { data: user } = await loggedClient.v2.me();

        // 3. Save to Connected Accounts
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        const { error: saveError } = await supabaseServer
            .from('connected_accounts')
            .upsert({
                user_id: dbState.user_id,
                platform: 'twitter',
                platform_user_id: user.id,
                username: user.username,
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, platform' });

        if (saveError) {
            console.error('Error saving account:', saveError);
            throw new Error('Failed to save account');
        }

        // 4. Cleanup State
        await supabaseServer.from('oauth_states').delete().eq('id', dbState.id);

        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/connections?success=Twitter%20connected%20successfully`);

    } catch (error) {
        console.error('Twitter Auth Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
