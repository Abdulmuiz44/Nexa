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
    percentage: number;
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

  // Fetch posts data
  const { data: posts } = await supabaseServer
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

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

  // Trends (simplified - would need historical data)
  const trends = calculateTrends(posts);

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
  // This would require content categorization logic
  // For now, return placeholder data
  return {
    educational: { percentage: 42, engagement: 5400 },
    productUpdates: { percentage: 28, engagement: 3600 },
    industryNews: { percentage: 30, engagement: 3847 }
  };
}

function calculateTrends(posts: any[]) {
  // Simplified trend calculation
  // In a real implementation, this would compare with previous periods
  const hasRecentPosts = posts.some(post =>
    new Date(post.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  return {
    engagement: hasRecentPosts ? 'up' : 'stable',
    reach: hasRecentPosts ? 'up' : 'stable',
    followers: hasRecentPosts ? 'up' : 'stable'
  };
}

function getTopPlatform(posts: any[]): string {
  const platformCounts = posts.reduce((acc, post) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topPlatform = Object.entries(platformCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return topPlatform ? topPlatform[0] : 'none';
}

export async function exportReport(userId: string, reportData: ReportData, format: 'pdf' | 'csv' | 'json' = 'json') {
  // TODO: Implement report export functionality
  // For now, just return the data
  return {
    format,
    data: reportData,
    exportedAt: new Date().toISOString()
  };
}
