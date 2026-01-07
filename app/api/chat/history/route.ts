import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // Fetch conversations for the user
        const { data: conversations, error } = await supabaseServer
            .from('conversations')
            .select(`
        id,
        title,
        created_at,
        messages (
          content,
          created_at
        )
      `)
            .eq('user_id', userId)
            .eq('source', 'web')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Supabase error fetching history:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format the history to include the last message and message count
         const formatted = (conversations || []).map((conv: any) => {
             const sortedMessages = (conv.messages || []).sort(
                 (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
             );

             return {
                 id: conv.id,
                 title: conv.title || 'Untitled Chat',
                 created_at: conv.created_at,
                 updated_at: conv.updated_at,
                 message_count: (conv.messages || []).length,
                 last_message: sortedMessages[0]?.content || 'No messages yet'
             };
         });

        return NextResponse.json({ conversations: formatted });
    } catch (err: any) {
        console.error('Failed to fetch chat history:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
