import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rows, error } = await supabaseServer
      .from('activity_log')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Logs query error:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    const logs = (rows || []).map((r: any) => ({
      id: r.id,
      timestamp: r.created_at,
      type: r.action,
      message: r.description || r.action,
      metadata: r.metadata || {},
    }));

    return NextResponse.json({ logs });
  } catch (error: unknown) {
    console.error('Logs fetch error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch logs'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, message, metadata } = await req.json();

    // TODO: Insert log into Supabase logs table
    console.log('Log created:', { type, message, metadata, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Log creation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create log'
    }, { status: 500 });
  }
}
