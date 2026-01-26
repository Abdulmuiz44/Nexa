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
    const recommendations = await analyticsEngine.getAIRecommendations(userId);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error in recommendations:', error);
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
    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get('id');

    if (!recommendationId) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    // Mark recommendation as implemented (if we have a table for it)
    // For now, just return success since we use on-the-fly generation
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error implementing recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
