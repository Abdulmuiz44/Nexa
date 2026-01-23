/**
 * Reply Agent API - Interests Management
 * GET /api/agent/interests - List user's interests
 * POST /api/agent/interests - Add a new interest
 * DELETE /api/agent/interests?id=[id] - Remove an interest
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function GET(): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const { data: interests, error } = await supabaseServer
            .from('twitter_interests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch interests:', error);
            return NextResponse.json({ interests: [], error: error.message });
        }

        return NextResponse.json({
            success: true,
            interests: interests || [],
            count: interests?.length || 0,
        });
    } catch (error) {
        console.error('Interests fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await request.json();

        const { keyword, hashtag, account_to_monitor, auto_engage_type, max_replies_per_hour } = body;

        if (!keyword && !hashtag && !account_to_monitor) {
            return NextResponse.json(
                { error: 'At least one of keyword, hashtag, or account_to_monitor is required' },
                { status: 400 }
            );
        }

        const { data: interest, error } = await supabaseServer
            .from('twitter_interests')
            .insert({
                user_id: userId,
                keyword: keyword || null,
                hashtag: hashtag || null,
                account_to_monitor: account_to_monitor || null,
                auto_engage_type: auto_engage_type || 'reply',
                max_replies_per_hour: max_replies_per_hour || 5,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create interest:', error);
            return NextResponse.json({ error: 'Failed to create interest' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            interest,
        });
    } catch (error) {
        console.error('Interest create error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const interestId = request.nextUrl.searchParams.get('id');

        if (!interestId) {
            return NextResponse.json({ error: 'Interest ID is required' }, { status: 400 });
        }

        const { error } = await supabaseServer
            .from('twitter_interests')
            .delete()
            .eq('id', interestId)
            .eq('user_id', userId);

        if (error) {
            console.error('Failed to delete interest:', error);
            return NextResponse.json({ error: 'Failed to delete interest' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Interest deleted',
        });
    } catch (error) {
        console.error('Interest delete error:', error);
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
        const { id, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: 'Interest ID is required' }, { status: 400 });
        }

        const { data: interest, error } = await supabaseServer
            .from('twitter_interests')
            .update({ is_active })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Failed to update interest:', error);
            return NextResponse.json({ error: 'Failed to update interest' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            interest,
        });
    } catch (error) {
        console.error('Interest update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
