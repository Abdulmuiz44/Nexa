import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`;

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

    // Generate the auth link
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(REDIRECT_URI, {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });

    // Store codeVerifier embedded in redirect_uri as JSON (fallback for missing metadata column)
    const redirectData = JSON.stringify({ uri: REDIRECT_URI, codeVerifier });

    // Save state and codeVerifier to DB - try with metadata first, fallback to redirect_uri
    let error;
    try {
        // Try inserting with metadata column
        const result = await supabaseServer.from('oauth_states').insert({
            state,
            redirect_uri: redirectData,
            platform: 'twitter',
            user_id: session.user.id,
            metadata: { codeVerifier }
        });
        error = result.error;
    } catch (e) {
        // If metadata column doesn't exist, try without it
        const result = await supabaseServer.from('oauth_states').insert({
            state,
            redirect_uri: redirectData,
            platform: 'twitter',
            user_id: session.user.id,
        });
        error = result.error;
    }

    if (error) {
        console.error('Error saving oauth state:', error);
        return NextResponse.json({ error: 'Failed to initialize auth state' }, { status: 500 });
    }

    // Redirect user to Twitter
    return NextResponse.redirect(url);
}
