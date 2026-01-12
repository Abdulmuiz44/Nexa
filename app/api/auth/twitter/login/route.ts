import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`;

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized - Please log in first' }, { status: 401 });
    }

    const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

    // Generate the auth link
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(REDIRECT_URI, {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });

    // Save state and codeVerifier to DB
    const { error } = await supabaseServer.from('oauth_states').insert({
        state,
        redirect_uri: REDIRECT_URI,
        platform: 'twitter',
        user_id: session.user.id,
        metadata: { codeVerifier }
    });

    if (error) {
        console.error('Error saving oauth state:', error);
        return NextResponse.json({ error: 'Failed to initialize auth state' }, { status: 500 });
    }

    // Redirect user to Twitter
    return NextResponse.redirect(url);
}
