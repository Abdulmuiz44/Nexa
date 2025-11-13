import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get('period') || '30', 10);

    const { generatePerformanceSummary } = await import('@/lib/utils/reports');
    const reportData = await generatePerformanceSummary(session.user.id, isNaN(period) ? 30 : period);

    const report = {
      period: reportData.period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalPosts: reportData.totalPosts,
        totalEngagement: reportData.totalEngagement,
        averageEngagementRate: reportData.averageEngagementRate,
        topPerformingPlatform: reportData.topPlatform,
      },
      platformBreakdown: reportData.platformBreakdown,
      contentPerformance: reportData.contentPerformance,
      trends: reportData.trends,
    };

    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error('Reports generation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate report'
    }, { status: 500 });
  }
}
