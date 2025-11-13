import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params
    const userId = session.user.id;
    const testId = resolvedParams.id;

    // Get the test and its variants
    const { data: test, error: testError } = await supabaseClient
      .from('ab_tests')
      .select(`
        *,
        variants:ab_test_variants(*)
      `)
      .eq('id', testId)
      .eq('user_id', userId)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.status !== 'running') {
      return NextResponse.json({ error: 'Test is not running' }, { status: 400 });
    }

    // Determine the winner based on engagement rate
    const variants = test.variants || [];
    if (variants.length === 0) {
      return NextResponse.json({ error: 'No variants found' }, { status: 400 });
    }

    const winner = variants.reduce((best, current) => {
      const bestRate = best.engagements / Math.max(best.impressions, 1);
      const currentRate = current.engagements / Math.max(current.impressions, 1);
      return currentRate > bestRate ? current : best;
    });

    // Update test with winner and status
    const { error: updateError } = await supabaseClient
      .from('ab_tests')
      .update({
        status: 'completed',
        winner_variant_id: winner.id,
        end_date: new Date().toISOString(),
      })
      .eq('id', testId);

    if (updateError) {
      console.error('Error stopping A/B test:', updateError);
      return NextResponse.json({ error: 'Failed to stop test' }, { status: 500 });
    }

    // Mark the winner variant
    await supabaseClient
      .from('ab_test_variants')
      .update({ is_winner: true })
      .eq('id', winner.id);

    return NextResponse.json({
      success: true,
      winner: {
        variantId: winner.id,
        variantName: winner.variant_name,
        improvement: calculateImprovement(variants, winner),
      }
    });
  } catch (error) {
    console.error('Error stopping A/B test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateImprovement(variants: any[], winner: any): number {
  const winnerRate = winner.engagements / Math.max(winner.impressions, 1);
  const avgOtherRate = variants
    .filter(v => v.id !== winner.id)
    .reduce((sum, v) => sum + (v.engagements / Math.max(v.impressions, 1)), 0) / Math.max(variants.length - 1, 1);

  if (avgOtherRate === 0) return 0;
  return ((winnerRate - avgOtherRate) / avgOtherRate) * 100;
}
