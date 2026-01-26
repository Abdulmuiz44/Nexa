import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsEngine } from '@/src/services/analyticsEngine';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const insights = await analyticsEngine.getPredictiveInsights(userId);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error in predictive insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // For now, we just call the same method, but we could add force-regenerate logic if caching is added
    const insights = await analyticsEngine.getPredictiveInsights(userId);

    return NextResponse.json({ insights, regenerated: true });
  } catch (error) {
    console.error('Error regenerating insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
