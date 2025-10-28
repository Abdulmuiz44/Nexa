import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import composio from '@/lib/composioClient';

export async function POST(req: NextRequest) {
  const { platform, content, connectionId } = await req.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Deduct credits
  const deductRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/credits/deduct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10 }),
  });

  if (!deductRes.ok) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  try {
    const result = await composio.actions.execute({
      actionId: platform === 'twitter' ? 'post_tweet' : 'post_reddit',
      connectionId,
      params: { content },
    });

    // Save post to database
    await supabase.from('posts').insert({
      user_id: userId,
      platform,
      content,
      status: 'published',
      composio_connection_id: connectionId,
    });

    // Log to analytics_daily_summary
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('analytics_daily_summary').upsert({
      user_id: userId,
      date: today,
      total_credits_spent: supabase.raw('total_credits_spent + 10'),
      total_posts: supabase.raw('total_posts + 1'),
    }, { onConflict: 'user_id,date' });

    return NextResponse.json({ success: true, postId: result.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
