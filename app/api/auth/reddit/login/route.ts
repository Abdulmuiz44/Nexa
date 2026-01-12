import { NextRequest, NextResponse } from 'next/server';
import Snoowrap from 'snoowrap';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from 'crypto';

const CLIENT_ID = process.env.REDDIT_CLIENT_ID!;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/reddit/callback`;

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: 'Unauthorized - Please log in first' }, { status: 401 });
    }

    const state = crypto.randomBytes(16).toString('hex');

    // Save state to DB for validation
    const { error } = await supabaseServer.from('oauth_states').insert({
        state,
        redirect_uri: REDIRECT_URI,
        platform: 'reddit',
        user_id: session.user.id
    });

    if (error) {
        console.error('Error saving oauth state:', error);
        return NextResponse.json({ error: 'Failed to initialize auth state' }, { status: 500 });
    }

    const url = Snoowrap.getAuthUrl({
        clientId: CLIENT_ID,
        scope: ['identity', 'submit', 'read', 'mysubreddits'],
        redirectUri: REDIRECT_URI,
        permanent: true,
        state
    });

    return NextResponse.redirect(url);
}
