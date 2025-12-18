import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { title = 'New Chat', source = 'web' } = await req.json().catch(() => ({}));

        // Create a new conversation session using the server client (bypasses RLS or uses service role)
        const { data: newConv, error } = await supabaseServer
            .from('conversations')
            .insert({
                user_id: session.user.id,
                source,
                title
            })
            .select('id')
            .single();

        if (error) {
            console.error('Supabase error creating session:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ session: newConv });
    } catch (err: any) {
        console.error('Failed to initialize chat session:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
