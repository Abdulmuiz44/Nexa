import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = getSupabaseClient();

    // Get user's tracked competitors
    const { data: competitors, error } = await supabase
      .from('competitor_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching competitors:', error);
      return NextResponse.json({ competitors: [] });
    }

    // For now, return mock data since we don't have actual competitor APIs
    // In production, this would integrate with social media APIs to fetch real data
    const competitorsWithData = (competitors || []).map(comp => ({
      ...comp,
      followers: Math.floor(Math.random() * 50000) + 1000,
      recentActivity: {
        posts: Math.floor(Math.random() * 20) + 5,
        engagement: Math.floor(Math.random() * 5000) + 500,
        growth: Math.floor(Math.random() * 20) - 5, // -5 to +15
      },
      topTopics: generateMockTopics(),
      postingPatterns: {
        bestDays: ['Monday', 'Wednesday', 'Friday'],
        bestTimes: ['9 AM', '2 PM', '6 PM'],
        frequency: '3-5 posts/week',
      },
      engagementRate: Math.floor(Math.random() * 10) + 2, // 2-12%
      lastAnalyzed: new Date().toISOString(),
    }));

    return NextResponse.json({ competitors: competitorsWithData });
  } catch (error) {
    console.error('Error in competitor analysis:', error);
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
    const { handle, platform } = await request.json();

    if (!handle || !platform) {
      return NextResponse.json({ error: 'Handle and platform are required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Check if competitor already exists
    const { data: existing } = await supabase
      .from('competitor_tracking')
      .select('id')
      .eq('user_id', userId)
      .eq('handle', handle)
      .eq('platform', platform)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Competitor already being tracked' }, { status: 400 });
    }

    // Add competitor to tracking
    const { data, error } = await supabase
      .from('competitor_tracking')
      .insert({
        user_id: userId,
        handle: handle.replace(/^@/, ''), // Remove @ prefix if present
        platform,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding competitor:', error);
      return NextResponse.json({ error: 'Failed to add competitor' }, { status: 500 });
    }

    // Return competitor with mock data
    const competitorWithData = {
      ...data,
      followers: Math.floor(Math.random() * 50000) + 1000,
      recentActivity: {
        posts: Math.floor(Math.random() * 20) + 5,
        engagement: Math.floor(Math.random() * 5000) + 500,
        growth: Math.floor(Math.random() * 20) - 5,
      },
      topTopics: generateMockTopics(),
      postingPatterns: {
        bestDays: ['Monday', 'Wednesday', 'Friday'],
        bestTimes: ['9 AM', '2 PM', '6 PM'],
        frequency: '3-5 posts/week',
      },
      engagementRate: Math.floor(Math.random() * 10) + 2,
      lastAnalyzed: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      competitor: competitorWithData
    });
  } catch (error) {
    console.error('Error adding competitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMockTopics(): string[] {
  const topics = [
    'AI Tools', 'Productivity', 'Tech Startups', 'SaaS', 'Marketing',
    'Growth Hacking', 'Content Creation', 'Social Media', 'Analytics',
    'Automation', 'Developer Tools', 'Design', 'UX/UI', 'Mobile Apps',
    'Web Development', 'Data Science', 'Machine Learning', 'Cloud Computing'
  ];

  // Return 3-6 random topics
  const shuffled = topics.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 4) + 3);
}
