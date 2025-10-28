import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  // Aggregate daily summaries
  const { data: users } = await supabase.from('users').select('id');

  for (const user of users || []) {
    // Aggregate from analytics table
    const { data: analytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr);

    const totalCredits = analytics?.reduce((sum, a) => sum + a.credits_spent, 0) || 0;
    const totalPosts = analytics?.length || 0;
    const totalEngagements = analytics?.reduce((sum, a) => sum + a.engagements, 0) || 0;
    const roi = totalCredits > 0 ? totalEngagements / totalCredits : 0;

    await supabase.from('analytics_daily_summary').upsert({
      user_id: user.id,
      date: dateStr,
      total_credits_spent: totalCredits,
      total_posts: totalPosts,
      total_engagements: totalEngagements,
      roi_estimate: roi,
    }, { onConflict: 'user_id,date' });
  }

  // Trigger AI insights for all users
  for (const user of users || []) {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/insights?userId=${user.id}`);
  }

  return NextResponse.json({ status: 'Analytics updated' });
}
