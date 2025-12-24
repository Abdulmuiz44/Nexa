import { supabaseServer } from '@/src/lib/supabaseServer';

export interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  totalPosts: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topPlatform: string;
  platformBreakdown: Record<string, {
    posts: number;
    engagement: number;
    engagementRate: number;
  }>;
  contentPerformance: Record<string, {
    count: number;
    engagement: number;
  }>;
  trends: {
    engagement: 'up' | 'down' | 'stable';
    reach: 'up' | 'down' | 'stable';
    followers: 'up' | 'down' | 'stable';
  };
}

export async function generatePerformanceSummary(userId: string, days: number = 30): Promise<ReportData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Previous period for trends
  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevEndDate.getDate() - days);

  // Fetch current period posts
  const { data: posts } = await supabaseServer
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Fetch previous period posts for trends
  const { data: prevPosts } = await supabaseServer
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', prevStartDate.toISOString())
    .lte('created_at', prevEndDate.toISOString());

  if (!posts) {
    return getEmptyReport(days, startDate, endDate);
  }

  // Calculate metrics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published');
  const totalEngagement = publishedPosts.reduce((sum, post) =>
    sum + (post.metadata?.engagement || 0), 0
  );

  // Platform breakdown
  const platformBreakdown = calculatePlatformBreakdown(posts);

  // Content performance
  const contentPerformance = calculateContentPerformance(posts);

  // Trends
  const trends = calculateTrends(posts, prevPosts || []);

  return {
    period: `${days} days`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalPosts,
    totalEngagement,
    averageEngagementRate: totalPosts > 0 ? Math.round((totalEngagement / totalPosts) * 100) / 100 : 0,
    topPlatform: getTopPlatform(posts),
    platformBreakdown,
    contentPerformance,
    trends
  };
}

function getEmptyReport(days: number, startDate: Date, endDate: Date): ReportData {
  return {
    period: `${days} days`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalPosts: 0,
    totalEngagement: 0,
    averageEngagementRate: 0,
    topPlatform: 'none',
    platformBreakdown: {},
    contentPerformance: {},
    trends: {
      engagement: 'stable',
      reach: 'stable',
      followers: 'stable'
    }
  };
}

function calculatePlatformBreakdown(posts: any[]) {
  const breakdown: Record<string, { posts: number; engagement: number; engagementRate: number }> = {};

  posts.forEach(post => {
    const platform = post.platform;
    if (!breakdown[platform]) {
      breakdown[platform] = { posts: 0, engagement: 0, engagementRate: 0 };
    }

    breakdown[platform].posts++;
    breakdown[platform].engagement += post.metadata?.engagement || 0;
  });

  // Calculate engagement rates
  Object.keys(breakdown).forEach(platform => {
    const data = breakdown[platform];
    data.engagementRate = data.posts > 0 ? Math.round((data.engagement / data.posts) * 100) / 100 : 0;
  });

  return breakdown;
}

function calculateContentPerformance(posts: any[]) {
  // Infer content type from metadata or hashtags, fallback to 'general'
  const performance: Record<string, { count: number; engagement: number }> = {};

  posts.forEach(post => {
    // Try to determine type from metadata, or default to general
    const type = post.metadata?.type || 'general';

    if (!performance[type]) {
      performance[type] = { count: 0, engagement: 0 };
    }
    performance[type].count++;
    performance[type].engagement += post.metadata?.engagement || 0;
  });

  return performance;
}

function calculateTrends(currentPosts: any[], prevPosts: any[]): { engagement: 'up' | 'down' | 'stable'; reach: 'up' | 'down' | 'stable'; followers: 'up' | 'down' | 'stable' } {
  const currentEngagement = currentPosts.reduce((sum, p) => sum + (p.metadata?.engagement || 0), 0);
  const prevEngagement = prevPosts.reduce((sum, p) => sum + (p.metadata?.engagement || 0), 0);

  const currentReach = currentPosts.reduce((sum, p) => sum + (p.metadata?.reach || 0), 0);
  const prevReach = prevPosts.reduce((sum, p) => sum + (p.metadata?.reach || 0), 0);

  const getTrend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 'up' : 'stable';
    const diff = (current - prev) / prev;
    if (diff > 0.05) return 'up';
    if (diff < -0.05) return 'down';
    return 'stable';
  };

  return {
    engagement: getTrend(currentEngagement, prevEngagement),
    reach: getTrend(currentReach, prevReach),
    followers: 'stable' // Followers data is usually snapshot-based, not transactional, so hard to track trend from posts alone without separate history table
  };
}

function getTopPlatform(posts: any[]): string {
  const platformCounts = posts.reduce((acc, post) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPlatform = Object.entries(platformCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  return topPlatform ? topPlatform[0] : 'none';
}

export async function exportReport(userId: string, reportData: ReportData, format: 'pdf' | 'csv' | 'json' = 'json') {
  if (format === 'json') {
    return {
      format,
      data: JSON.stringify(reportData, null, 2),
      filename: `report-${new Date().toISOString().split('T')[0]}.json`
    };
  }

  if (format === 'csv') {
    // Flatten data for CSV
    const rows = [
      ['Metric', 'Value'],
      ['Total Posts', reportData.totalPosts],
      ['Total Engagement', reportData.totalEngagement],
      ['Avg Engagement Rate', reportData.averageEngagementRate],
      ['Top Platform', reportData.topPlatform],
      [],
      ['Platform', 'Posts', 'Engagement', 'Rate'],
      ...Object.entries(reportData.platformBreakdown).map(([platform, data]) => [
        platform, data.posts, data.engagement, data.engagementRate
      ])
    ];

    const csvContent = rows.map(e => e.join(',')).join('\n');
    return {
      format,
      data: csvContent,
      filename: `report-${new Date().toISOString().split('T')[0]}.csv`
    };
  }

  // Fallback for PDF (not implemented) or other formats
  return {
    format,
    data: reportData,
    error: 'Format not fully supported'
  };
}
