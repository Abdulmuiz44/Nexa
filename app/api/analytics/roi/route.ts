import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Get campaign costs and credits used
    const { data: creditTransactions, error: creditsError } = await supabaseClient
      .from('credit_transactions')
      .select('amount, created_at, type')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .eq('type', 'debit'); // Only spending transactions

    if (creditsError) {
      console.error('Error fetching credit transactions:', creditsError);
    }

    // Calculate total investment (1 credit = $0.10)
    const totalCreditsUsed = (creditTransactions || []).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const totalInvestment = totalCreditsUsed * 0.10; // $0.10 per credit

    // Get posts and their performance metrics
    const { data: posts, error: postsError } = await supabaseClient
      .from('posts')
      .select('id, platform, published_at, metrics, url')
      .eq('user_id', userId)
      .eq('status', 'published')
      .gte('published_at', startDate.toISOString());

    if (postsError) {
      console.error('Error fetching posts:', postsError);
    }

    // Mock revenue data - in production, this would come from actual conversion tracking
    // For now, we'll simulate revenue based on engagement metrics
    const postsData = posts || [];
    let simulatedRevenue = 0;
    let totalEngagements = 0;

    postsData.forEach(post => {
      const engagements = (post.metrics?.likes || 0) +
                         (post.metrics?.comments || 0) +
                         (post.metrics?.shares || 0) +
                         (post.metrics?.clicks || 0);
      totalEngagements += engagements;

      // Simulate conversions: assume 0.5% of engagements convert to revenue
      // Average order value of $50
      simulatedRevenue += engagements * 0.005 * 50;
    });

    // Calculate ROI metrics
    const roi = totalInvestment > 0 ? ((simulatedRevenue - totalInvestment) / totalInvestment) * 100 : 0;
    const paybackPeriod = totalInvestment > 0 ? Math.ceil((totalInvestment / simulatedRevenue) * 30) : 0; // days
    const customerAcquisitionCost = totalEngagements > 0 ? totalInvestment / (totalEngagements * 0.005) : 0;
    const lifetimeValue = simulatedRevenue / Math.max(totalEngagements * 0.005, 1);
    const conversionRate = totalEngagements > 0 ? (totalEngagements * 0.005 / totalEngagements) * 100 : 0;

    // Attribution breakdown (mock data)
    const attributionData = {
      direct: 35,
      social: 45,
      organic: 20,
    };

    const roiData = {
      totalInvestment,
      totalRevenue: simulatedRevenue,
      roi,
      paybackPeriod,
      customerAcquisitionCost,
      lifetimeValue,
      conversionRate,
      attributionData,
    };

    return NextResponse.json({ roiData });
  } catch (error) {
    console.error('Error in ROI tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
