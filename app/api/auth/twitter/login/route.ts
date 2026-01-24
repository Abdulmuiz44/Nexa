import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

// Ensure REDIRECT_URI is consistent and uses the current host if NEXTAUTH_URL is confusing
// Twitter OAuth 2.0 is very strict about redirect URIs
const getRedirectUri = (req: NextRequest) => {
    const url = new URL(req.url);

    // If NEXTAUTH_URL is set, use it. 
    // Otherwise, use the current host.
    // FORCE http for localhost if not specifically specified as https
    let host = process.env.NEXTAUTH_URL;

    if (!host) {
        const protocol = url.host.includes('localhost') || url.host.includes('127.0.0.1') ? 'http:' : url.protocol;
        host = `${protocol}//${url.host}`;
    } else if ((host.includes('localhost') || host.includes('127.0.0.1')) && !host.startsWith('https:')) {
        // Ensure no trailing slash and correct protocol for local dev
        if (host.startsWith('https:')) {
            // keep as is
        } else if (!host.startsWith('http:')) {
            host = 'http://' + host;
        }
    }

    return `${host.replace(/\/$/, '')}/api/auth/twitter/callback`;
};

export async function GET(req: NextRequest) {
    // Validate Twitter credentials are configured
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('Twitter OAuth Error: TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET not configured in environment variables');
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/connections?error=${encodeURIComponent('Twitter API credentials not configured. Please add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to your environment variables.')}`);
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized - Please log in first' }, { status: 401 });
    }

    const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });
    const redirectUri = getRedirectUri(req);

    // Generate the auth link
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(redirectUri, {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });

    // Store codeVerifier embedded in redirect_uri as JSON (fallback for missing metadata column)
    const redirectData = JSON.stringify({ uri: redirectUri, codeVerifier });

    // Save state and codeVerifier to DB - try with metadata first, fallback to redirect_uri
    const resultWithMetadata = await supabaseServer.from('oauth_states').insert({
        state,
        redirect_uri: redirectData,
        platform: 'twitter',
        user_id: session.user.id,
        metadata: { codeVerifier }
    });

    let finalError = resultWithMetadata.error;

    // If metadata column doesn't exist (PGRST204 or similar), try without it
    if (finalError && (finalError.code === 'PGRST204' || finalError.message?.includes('metadata'))) {
        console.warn('Metadata column missing in oauth_states, falling back to JSON in redirect_uri');
        const resultFallback = await supabaseServer.from('oauth_states').insert({
            state,
            redirect_uri: redirectData,
            platform: 'twitter',
            user_id: session.user.id,
        });
        finalError = resultFallback.error;
    }

    if (finalError) {
        console.error('Error saving oauth state:', finalError);
        return NextResponse.json({ error: 'Failed to initialize auth state', details: finalError.message }, { status: 500 });
    }

    // Redirect user to Twitter
    return NextResponse.redirect(url);
}
