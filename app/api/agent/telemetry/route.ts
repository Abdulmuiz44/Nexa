import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { AutonomousAgentManager } from '@/src/services/autonomousAgent';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = String((session.user as any).id);

    // Get agent status
    const agent = AutonomousAgentManager.getAgent(userId);
    const isRunning = agent !== undefined;

    // Get recent activity from logs
    const { data: recentActivity } = await supabaseServer
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .in('action', ['auto_tweet_posted', 'auto_reddit_post', 'auto_like', 'auto_retweet', 'auto_reply', 'agent_started', 'agent_stopped'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Get pending posts (scheduled but not yet published)
    const { data: pendingPosts } = await supabaseServer
      .from('posts')
      .select('id, platform, scheduled_at, status')
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    // Get recent posts for engagement metrics
    const { data: recentPosts } = await supabaseServer
      .from('posts')
      .select('id, platform, created_at, status')
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate engagement stats
    const engagementStats = {
      posts_today: recentPosts?.filter(p => {
        const postDate = new Date(p.created_at);
        const today = new Date();
        return postDate.toDateString() === today.toDateString();
      }).length || 0,
      total_posts: recentPosts?.length || 0,
    };

    return NextResponse.json({
      isRunning,
      status: isRunning ? 'active' : 'stopped',
      recentActivity: recentActivity || [],
      pendingPosts: pendingPosts || [],
      engagementStats,
    });
  } catch (error: any) {
    console.error('Error getting agent telemetry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get agent telemetry' },
      { status: 500 }
    );
  }
}
