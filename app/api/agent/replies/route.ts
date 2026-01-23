/**
 * Reply Queue API
 * GET /api/agent/replies - List pending/recent replies
 * POST /api/agent/replies - Generate replies for interests
 * PATCH /api/agent/replies - Approve/reject a reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY || '',
});

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const status = request.nextUrl.searchParams.get('status') || 'pending';

        const { data: replies, error } = await supabaseServer
            .from('reply_queue')
            .select('*, twitter_interests(keyword, hashtag)')
            .eq('user_id', userId)
            .eq('status', status)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Failed to fetch replies:', error);
            return NextResponse.json({ replies: [], error: error.message });
        }

        return NextResponse.json({
            success: true,
            replies: replies || [],
            count: replies?.length || 0,
        });
    } catch (error) {
        console.error('Replies fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();
        const { id, action, edited_reply } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'Reply ID and action are required' }, { status: 400 });
        }

        if (!['approve', 'reject', 'edit'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        let updates: any = {};

        if (action === 'approve') {
            updates.status = 'approved';
        } else if (action === 'reject') {
            updates.status = 'rejected';
        } else if (action === 'edit') {
            if (!edited_reply) {
                return NextResponse.json({ error: 'Edited reply content is required' }, { status: 400 });
            }
            updates.generated_reply = edited_reply;
            updates.status = 'approved';
        }

        const { data: reply, error } = await supabaseServer
            .from('reply_queue')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Failed to update reply:', error);
            return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 });
        }

        // If approved, post the reply
        if (updates.status === 'approved') {
            try {
                const { post_to_platform } = await import('@/src/services/postToPlatform');

                // Post as a reply - we'll need to enhance postToPlatform for this
                // For now, mark as approved and let a worker handle it
                await supabaseServer
                    .from('reply_queue')
                    .update({ status: 'approved' })
                    .eq('id', id);
            } catch (postError) {
                console.error('Failed to post reply:', postError);
            }
        }

        return NextResponse.json({
            success: true,
            reply,
            action,
        });
    } catch (error) {
        console.error('Reply update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Generate AI replies for a given tweet
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();
        const { tweet_id, tweet_content, author_username, author_id, interest_id } = body;

        if (!tweet_content) {
            return NextResponse.json({ error: 'Tweet content is required' }, { status: 400 });
        }

        // Generate reply using Mistral AI
        const systemPrompt = `You are a helpful social media assistant generating engaging Twitter replies.
Keep replies:
- Concise (under 280 characters)
- Friendly and conversational
- Relevant to the original tweet
- Without hashtags unless very relevant
- Natural and human-sounding

Do not be overly promotional. Be genuinely helpful or add value to the conversation.`;

        const response = await mistral.chat.complete({
            model: 'mistral-small-latest',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a thoughtful reply to this tweet:\n\n"${tweet_content}"\n\nBy @${author_username}` },
            ],
            maxTokens: 100,
            temperature: 0.7,
        });

        const generatedReply = (response.choices?.[0]?.message?.content as string) || '';

        // Save to queue
        const { data: reply, error } = await supabaseServer
            .from('reply_queue')
            .insert({
                user_id: userId,
                interest_id: interest_id || null,
                source_tweet_id: tweet_id || `manual-${Date.now()}`,
                source_tweet_content: tweet_content,
                source_author_username: author_username || 'unknown',
                source_author_id: author_id || null,
                generated_reply: generatedReply.trim(),
                status: 'pending',
                ai_confidence: 0.85,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to save reply:', error);
            return NextResponse.json({ error: 'Failed to save reply' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            reply,
            generated_reply: generatedReply.trim(),
        });
    } catch (error) {
        console.error('Reply generation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
