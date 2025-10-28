import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  // Get variants with engagement
  const { data: variants } = await supabase
    .from('content_variants')
    .select('*')
    .is('winner', null); // Not yet analyzed

  for (const variant of variants || []) {
    // Mock engagement fetch, in real: from analytics
    const aEng = Math.floor(Math.random() * 100);
    const bEng = Math.floor(Math.random() * 100);

    const winner = aEng > bEng ? 'A' : 'B';

    await supabase
      .from('content_variants')
      .update({ winner, a_engagement: aEng, b_engagement: bEng })
      .eq('id', variant.id);

    // Update analytics
    const style = winner === 'A' ? 'variant_a_style' : 'variant_b_style';
    await supabase
      .from('analytics_daily_summary')
      .update({ top_performing_style: style })
      .eq('user_id', variant.user_id);

    // Notification
    await supabase.from('notifications').insert({
      user_id: variant.user_id,
      type: 'ab_test_result',
      message: `Variant ${winner} won with ${Math.max(aEng, bEng)} engagements.`,
      read: false,
    });
  }

  return NextResponse.json({ status: 'Variants analyzed' });
}
