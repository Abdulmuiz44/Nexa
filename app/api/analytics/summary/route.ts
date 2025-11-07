import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'
import { analyticsEngine } from '@/src/services/analyticsEngine'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const timeframeParam = (searchParams.get('timeframe') || 'week').toLowerCase()
    const timeframe = ['day', 'week', 'month'].includes(timeframeParam)
      ? (timeframeParam as 'day' | 'week' | 'month')
      : 'week'

    const summary = await analyticsEngine.getAnalyticsSummary(session.user.id, timeframe)

    return NextResponse.json({ summary })
  } catch (error: unknown) {
    console.error('Analytics summary error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to load analytics summary',
    }, { status: 500 })
  }
}
