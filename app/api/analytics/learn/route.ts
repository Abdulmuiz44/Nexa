import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentGenerator } from '@/src/services/contentGenerator';
import { supabaseServer } from '@/src/lib/supabaseServer';

const contentGenerator = new ContentGenerator();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    // Allow admin/system calls to analyze any user's analytics
    // or regular users to analyze their own
    const targetUserId = userId || session.user.id;

    if (targetUserId !== session.user.id && session.user.email !== 'admin@nexa.ai') {
      return NextResponse.json({ error: 'Unauthorized to analyze other users' }, { status: 403 });
    }

    // Run analytics learning
    await contentGenerator.learnFromAnalytics(targetUserId);

    // Get updated learning data
    const { data: user } = await supabaseServer
      .from('users')
      .select('onboarding_data')
      .eq('id', targetUserId)
      .single();

    const learningData = user?.onboarding_data?.ai_learning || {};

    return NextResponse.json({
      success: true,
      learningData,
      message: 'Analytics learning completed successfully'
    });
  } catch (error: any) {
    console.error('Analytics learning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run analytics learning' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current learning insights
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabaseServer
      .from('users')
      .select('onboarding_data')
      .eq('id', session.user.id)
      .single();

    const learningData = user?.onboarding_data?.ai_learning || {
      successful_patterns: [],
      avoid_patterns: [],
      last_updated: null,
    };

    return NextResponse.json({ learningData });
  } catch (error: any) {
    console.error('Analytics insights error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get analytics insights' },
      { status: 500 }
    );
  }
}
