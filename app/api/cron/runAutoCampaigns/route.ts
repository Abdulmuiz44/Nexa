import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import openai from '@/lib/openaiClient';
import composio from '@/lib/composioClient';

export async function GET(req: NextRequest) {
  const today = new Date().toISOString().split('T')[0];

  // Find due campaigns
  const { data: campaigns } = await supabase
    .from('auto_campaigns')
    .select('*')
    .eq('status', 'active')
    .lte('next_run', new Date().toISOString());

  for (const campaign of campaigns || []) {
    // Check credit cap
    const { data: wallet } = await supabase
      .from('credits_wallet')
      .select('balance')
      .eq('user_id', campaign.user_id)
      .single();

    if (!wallet || wallet.balance < campaign.daily_credit_cap) {
      // Pause campaign
      await supabase
        .from('auto_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign.id);

      await supabase.from('notifications').insert({
        user_id: campaign.user_id,
        type: 'campaign_paused',
        message: 'Auto Campaign paused due to low credits.',
        read: false,
      });
      continue;
    }

    // Get insights
    const { data: reports } = await supabase
      .from('weekly_reports')
      .select('insights')
      .eq('user_id', campaign.user_id)
      .order('week_end', { ascending: false })
      .limit(1);

    const prompt = `Generate 3 short posts for ${campaign.platforms.join(', ')} in ${campaign.style} tone based on: ${reports?.[0]?.insights || 'general growth'}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const posts = response.choices[0].message.content?.split('\n').filter(p => p.trim()) || [];

    // Deduct for generation
    await supabase
      .from('credits_wallet')
      .update({ balance: wallet.balance - 10 })
      .eq('user_id', campaign.user_id);

    for (const post of posts.slice(0, 3)) {
      // Post to platforms
      for (const platform of campaign.platforms) {
        const { data: connections } = await supabase
          .from('connected_accounts')
          .select('composio_connection_id')
          .eq('user_id', campaign.user_id)
          .eq('platform', platform);

        if (connections?.length) {
          try {
            await composio.actions.execute({
              actionId: platform === 'twitter' ? 'post_tweet' : 'post_reddit',
              connectionId: connections[0].composio_connection_id,
              params: { content: post },
            });

            // Deduct for post
            await supabase
              .from('credits_wallet')
              .update({ balance: supabase.raw('balance - 10') })
              .eq('user_id', campaign.user_id);

            // Log post
            await supabase.from('posts').insert({
              user_id: campaign.user_id,
              platform,
              content: post,
              status: 'published',
              composio_connection_id: connections[0].composio_connection_id,
            });
          } catch (error) {
            console.error('Posting failed:', error);
          }
        }
      }
    }

    // Update next run
    const nextRun = new Date(campaign.next_run);
    nextRun.setDate(nextRun.getDate() + (campaign.frequency === 'weekly' ? 7 : 14));

    await supabase
      .from('auto_campaigns')
      .update({ last_run: new Date().toISOString(), next_run: nextRun.toISOString() })
      .eq('id', campaign.id);

    // Notification
    await supabase.from('notifications').insert({
      user_id: campaign.user_id,
      type: 'campaign_run',
      message: 'Auto Campaign executed successfully!',
      read: false,
    });
  }

  return NextResponse.json({ status: 'Auto campaigns run' });
}
