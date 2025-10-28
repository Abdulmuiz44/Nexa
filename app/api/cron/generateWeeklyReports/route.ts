import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import openai from '@/lib/openaiClient';

export async function GET(req: NextRequest) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() - 1);

  const { data: users } = await supabase.from('users').select('id, name, email');

  for (const user of users || []) {
    // Aggregate weekly data
    const { data: summary } = await supabase
      .from('analytics_daily_summary')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', weekEnd.toISOString().split('T')[0]);

    const totalCredits = summary?.reduce((sum, s) => sum + s.total_credits_spent, 0) || 0;
    const totalPosts = summary?.reduce((sum, s) => sum + s.total_posts, 0) || 0;
    const totalEngagements = summary?.reduce((sum, s) => sum + s.total_engagements, 0) || 0;
    const avgROI = summary?.length ? summary.reduce((sum, s) => sum + s.roi_estimate, 0) / summary.length : 0;

    // AI insights
    const prompt = `Generate weekly growth insights for user: credits ${totalCredits}, posts ${totalPosts}, engagements ${totalEngagements}, avg ROI ${avgROI}. Suggest 3 content ideas.`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    const insights = response.choices[0].message.content;

    // Save report
    await supabase.from('weekly_reports').insert({
      user_id: user.id,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      insights,
      roi_summary: `Avg ROI: ${avgROI}`,
      recommendations: 'Keep posting high-engagement topics.',
    });

    // Add to email queue
    const subject = 'Your Weekly Nexa Growth Report 🚀';
    const body = generateEmailTemplate(user.name, totalCredits, totalPosts, avgROI, insights);
    await supabase.from('email_queue').insert({
      user_id: user.id,
      subject,
      body,
      status: 'pending',
    });

    // Notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'weekly_report',
      message: 'Your new weekly report is ready!',
      read: false,
    });
  }

  return NextResponse.json({ status: 'Reports generated' });
}

function generateEmailTemplate(name: string, credits: number, posts: number, roi: number, insights: string) {
  return `
    <h1>Hi ${name}!</h1>
    <p>Weekly Summary:</p>
    <ul>
      <li>Credits Spent: ${credits}</li>
      <li>Posts: ${posts}</li>
      <li>Avg ROI: ${roi}</li>
    </ul>
    <p>${insights}</p>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/analytics">Open Dashboard</a>
  `;
}
