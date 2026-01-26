import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsEngine } from '@/src/services/analyticsEngine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';

    const roiData = await analyticsEngine.getROIData(userId, timeframe);

    return NextResponse.json({ roiData });
  } catch (error) {
    console.error('Error in ROI tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
