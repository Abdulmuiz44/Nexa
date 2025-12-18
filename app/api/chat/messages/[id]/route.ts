import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conversationId = params.id;

        // Verify conversation ownership
        const { data: conversation } = await supabaseServer
            .from('conversations')
            .select('user_id')
            .eq('id', conversationId)
            .single();

        if (!conversation || conversation.user_id !== session.user.id) {
            return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
        }

        // Fetch messages
        const { data: messages, error } = await supabaseServer
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Supabase error fetching messages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages: messages || [] });
    } catch (err: any) {
        console.error('Failed to fetch messages:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
