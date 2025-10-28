import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import openai from '@/lib/openaiClient';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  // Get recent analytics
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: summary } = await supabase
    .from('analytics_daily_summary')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

  const prompt = `Analyze this user's analytics: ${JSON.stringify(summary)}. Generate a concise summary of performance trends and ROI insights.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const insight = response.choices[0].message.content;

  // Save insight
  await supabase.from('analytics_insights').insert({
    user_id: userId,
    insight,
  });

  return NextResponse.json({ insight });
}
