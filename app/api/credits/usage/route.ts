import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get credit usage statistics
    const { data: transactions, error } = await supabaseServer
      .from('credit_transactions')
      .select('credits, tx_type, created_at, description, metadata')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Credit usage query error:', error);
      return NextResponse.json({ error: 'Failed to fetch credit usage' }, { status: 500 });
    }

    // Calculate usage statistics
    const usageStats = {
      totalSpent: 0,
      totalEarned: 0,
      byType: {} as Record<string, number>,
      byDay: {} as Record<string, number>,
      recentUsage: [] as any[],
    };

    transactions?.forEach(tx => {
      const credits = Number(tx.credits);
      const dateKey = new Date(tx.created_at).toISOString().split('T')[0];

      if (credits < 0) {
        usageStats.totalSpent += Math.abs(credits);
      } else {
        usageStats.totalEarned += credits;
      }

      // Group by type
      const type = tx.tx_type;
      usageStats.byType[type] = (usageStats.byType[type] || 0) + Math.abs(credits);

      // Group by day
      usageStats.byDay[dateKey] = (usageStats.byDay[dateKey] || 0) + Math.abs(credits);

      // Recent usage (last 10)
      if (usageStats.recentUsage.length < 10) {
        usageStats.recentUsage.push({
          date: tx.created_at,
          type: tx.tx_type,
          credits: Math.abs(credits),
          description: tx.description,
          metadata: tx.metadata,
        });
      }
    });

    return NextResponse.json({
      timeframe,
      usageStats,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Credit usage error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get credit usage' },
      { status: 500 }
    );
  }
}
