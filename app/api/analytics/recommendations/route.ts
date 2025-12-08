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

    // Get existing recommendations
    const { data: existingRecommendations, error: recError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (recError) {
      console.error('Error fetching recommendations:', recError);
    }

    // Get user's posting history to generate new recommendations
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        platform,
        published_at,
        metrics,
        created_at
      `)
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ recommendations: existingRecommendations || [] });
    }

    // Generate new recommendations based on current data
    const newRecommendations = await generateRecommendations(posts || [], existingRecommendations || []);

    // Save new recommendations to database
    if (newRecommendations.length > 0) {
      const { error: insertError } = await supabase
        .from('recommendations')
        .insert(newRecommendations.map(rec => ({
          user_id: userId,
          ...rec,
          created_at: new Date().toISOString(),
        })));

      if (insertError) {
        console.error('Error saving recommendations:', insertError);
      }
    }

    // Return all recommendations (existing + new)
    const allRecommendations = [...(existingRecommendations || []), ...newRecommendations];

    return NextResponse.json({ recommendations: allRecommendations });
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

    const supabase = getSupabaseClient();

    // Mark recommendation as implemented
    const { error } = await supabase
      .from('recommendations')
      .update({
        implemented: true,
        implemented_at: new Date().toISOString(),
      })
      .eq('id', recommendationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error implementing recommendation:', error);
      return NextResponse.json({ error: 'Failed to implement recommendation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error implementing recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateRecommendations(posts: any[], existingRecommendations: any[]): Promise<any[]> {
  const recommendations = [];
  const existingIds = new Set(existingRecommendations.map(r => r.id));

  if (posts.length < 5) {
    // Not enough data for meaningful recommendations
    if (!existingIds.has('insufficient-data')) {
      recommendations.push({
        id: 'insufficient-data',
        type: 'strategy',
        priority: 'high',
        title: 'Generate more content to unlock AI insights',
        description: 'You need at least 5 published posts for the AI to analyze patterns and provide personalized recommendations.',
        expectedImpact: 'Unlock advanced features',
        timeToImplement: '1-2 days',
        confidence: 100,
        implemented: false,
      });
    }
    return recommendations;
  }

  // Analyze posting frequency
  const recentPosts = posts.filter(p => {
    const postDate = new Date(p.published_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return postDate > weekAgo;
  });

  if (recentPosts.length < 3 && !existingIds.has('increase-posting-frequency')) {
    recommendations.push({
      id: 'increase-posting-frequency',
      type: 'strategy',
      priority: 'high',
      title: 'Increase posting frequency to boost growth',
      description: `You've posted ${recentPosts.length} times this week. Increasing to 5-7 posts per week could significantly improve your reach and engagement.`,
      expectedImpact: '50-100% more impressions',
      timeToImplement: '1 week',
      confidence: 85,
      implemented: false,
    });
  }

  // Analyze content performance
  const highPerformingPosts = posts.filter(p => {
    const engagement = (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0);
    return engagement > 10; // Threshold for "high performing"
  });

  if (highPerformingPosts.length > 0) {
    const commonPatterns = analyzeContentPatterns(highPerformingPosts);

    if (commonPatterns.length > 0 && !existingIds.has('content-patterns')) {
      recommendations.push({
        id: 'content-patterns',
        type: 'content',
        priority: 'medium',
        title: 'Use proven content patterns for better results',
        description: `Your high-performing posts often include: ${commonPatterns.slice(0, 3).join(', ')}. Incorporate these elements into your content strategy.`,
        expectedImpact: '25-40% engagement increase',
        timeToImplement: '3 days',
        confidence: 75,
        implemented: false,
      });
    }
  }

  // Platform optimization
  const platformStats = analyzePlatformPerformance(posts);

  if (platformStats.bestPlatform && !existingIds.has('platform-optimization')) {
    recommendations.push({
      id: 'platform-optimization',
      type: 'strategy',
      priority: 'high',
      title: `Focus on ${platformStats.bestPlatform} for maximum impact`,
      description: `${platformStats.bestPlatform} delivers ${platformStats.bestPerformance}% better engagement than your other platforms.`,
      expectedImpact: '30-50% better results',
      timeToImplement: '1 week',
      confidence: 80,
      implemented: false,
    });
  }

  // Timing optimization
  const bestTimes = analyzeBestPostingTimes(posts);

  if (bestTimes.length > 0 && !existingIds.has('timing-optimization')) {
    const timeLabels = bestTimes.map(hour => {
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    });

    recommendations.push({
      id: 'timing-optimization',
      type: 'timing',
      priority: 'medium',
      title: `Post during optimal hours: ${timeLabels.join(', ')}`,
      description: `Your content performs best when posted during ${timeLabels.join(', ')}. This could increase engagement by up to 35%.`,
      expectedImpact: '25-35% engagement boost',
      timeToImplement: '2 days',
      confidence: 70,
      implemented: false,
    });
  }

  // Content length optimization
  const optimalLength = analyzeContentLength(posts);

  if (optimalLength.recommendation && !existingIds.has('content-length')) {
    recommendations.push({
      id: 'content-length',
      type: 'content',
      priority: 'low',
      title: optimalLength.title,
      description: optimalLength.description,
      expectedImpact: optimalLength.impact,
      timeToImplement: '1 day',
      confidence: 65,
      implemented: false,
    });
  }

  // Hashtag strategy
  if (!existingIds.has('hashtag-strategy')) {
    recommendations.push({
      id: 'hashtag-strategy',
      type: 'optimization',
      priority: 'low',
      title: 'Optimize hashtag usage for better discoverability',
      description: 'Use 3-5 relevant hashtags per post and include a mix of popular and niche tags to increase visibility.',
      expectedImpact: '15-25% more reach',
      timeToImplement: '2 days',
      confidence: 60,
      implemented: false,
    });
  }

  return recommendations;
}

function analyzeContentPatterns(posts: any[]): string[] {
  const patterns = [];

  // Check for questions
  const questionPosts = posts.filter(p => p.content?.includes('?'));
  if (questionPosts.length > posts.length * 0.6) {
    patterns.push('questions');
  }

  // Check for emojis
  const emojiPosts = posts.filter(p => /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(p.content));
  if (emojiPosts.length > posts.length * 0.5) {
    patterns.push('emojis');
  }

  // Check for calls to action
  const ctaPosts = posts.filter(p =>
    p.content?.toLowerCase().includes('check out') ||
    p.content?.toLowerCase().includes('learn more') ||
    p.content?.toLowerCase().includes('sign up')
  );
  if (ctaPosts.length > posts.length * 0.4) {
    patterns.push('calls to action');
  }

  return patterns;
}

function analyzePlatformPerformance(posts: any[]) {
  const platformStats: Record<string, { engagement: number; count: number }> = {};

  posts.forEach(post => {
    if (!platformStats[post.platform]) {
      platformStats[post.platform] = { engagement: 0, count: 0 };
    }

    const engagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
    platformStats[post.platform].engagement += engagement;
    platformStats[post.platform].count += 1;
  });

  let bestPlatform = null;
  let bestPerformance = 0;

  Object.entries(platformStats).forEach(([platform, stats]) => {
    const avgEngagement = stats.engagement / stats.count;
    if (avgEngagement > bestPerformance) {
      bestPlatform = platform;
      bestPerformance = avgEngagement;
    }
  });

  return { bestPlatform, bestPerformance: Math.round(bestPerformance * 100) };
}

function analyzeBestPostingTimes(posts: any[]): number[] {
  const hourStats: Record<number, { engagement: number; count: number }> = {};

  posts.forEach(post => {
    if (post.published_at) {
      const hour = new Date(post.published_at).getHours();

      if (!hourStats[hour]) {
        hourStats[hour] = { engagement: 0, count: 0 };
      }

      const engagement = (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0);
      hourStats[hour].engagement += engagement;
      hourStats[hour].count += 1;
    }
  });

  return Object.entries(hourStats)
    .sort(([, a], [, b]) => (b.engagement / b.count) - (a.engagement / a.count))
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
}

function analyzeContentLength(posts: any[]) {
  const lengths = posts.map(p => p.content?.length || 0);
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

  const highPerformingLengths = posts
    .filter(p => {
      const engagement = (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0);
      return engagement > 5;
    })
    .map(p => p.content?.length || 0);

  const avgHighPerformingLength = highPerformingLengths.length > 0
    ? highPerformingLengths.reduce((sum, len) => sum + len, 0) / highPerformingLengths.length
    : avgLength;

  if (Math.abs(avgHighPerformingLength - avgLength) > 50) {
    if (avgHighPerformingLength > avgLength) {
      return {
        title: 'Try longer posts for better engagement',
        description: `Your high-performing posts average ${Math.round(avgHighPerformingLength)} characters vs your overall average of ${Math.round(avgLength)} characters.`,
        impact: '20-30% engagement increase',
        recommendation: true,
      };
    } else {
      return {
        title: 'Try shorter posts for better engagement',
        description: `Your high-performing posts average ${Math.round(avgHighPerformingLength)} characters vs your overall average of ${Math.round(avgLength)} characters.`,
        impact: '20-30% engagement increase',
        recommendation: true,
      };
    }
  }

  return { recommendation: false };
}
