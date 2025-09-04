// NEXA - Analytics API Routes

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaign_id = searchParams.get('campaign_id');
    const platform = searchParams.get('platform');
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type') || 'overview';

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    if (type === 'overview') {
      // Get overall performance metrics
      let query = supabase
        .from('analytics')
        .select(`
          *,
          posts!inner (
            platform,
            campaign_id,
            campaigns!inner (
              name,
              tool_id,
              tools!inner (name)
            )
          )
        `)
        .gte('recorded_at', dateFrom.toISOString());

      if (campaign_id) {
        query = query.eq('posts.campaign_id', campaign_id);
      }

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Calculate aggregated metrics
      const metrics = data?.reduce((acc, record) => {
        acc.totalImpressions += record.impressions || 0;
        acc.totalLikes += record.likes || 0;
        acc.totalShares += record.shares || 0;
        acc.totalComments += record.comments || 0;
        acc.totalClicks += record.clicks || 0;
        acc.totalReach += record.reach || 0;
        return acc;
      }, {
        totalImpressions: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        totalClicks: 0,
        totalReach: 0
      }) || {};

      const totalEngagement = metrics.totalLikes + metrics.totalShares + metrics.totalComments;
      const engagementRate = metrics.totalImpressions > 0 
        ? (totalEngagement / metrics.totalImpressions) * 100 
        : 0;
      const clickThroughRate = metrics.totalImpressions > 0
        ? (metrics.totalClicks / metrics.totalImpressions) * 100
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          ...metrics,
          totalEngagement,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
          clickThroughRate: parseFloat(clickThroughRate.toFixed(2)),
          totalPosts: data?.length || 0
        }
      });

    } else if (type === 'timeline') {
      // Get time-series data for charts
      const { data, error } = await supabase
        .from('analytics')
        .select(`
          date,
          impressions,
          likes,
          shares,
          comments,
          clicks,
          platform
        `)
        .gte('date', dateFrom.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Group by date and aggregate
      const timelineData = data?.reduce((acc, record) => {
        const date = record.date;
        if (!acc[date]) {
          acc[date] = {
            date,
            impressions: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            clicks: 0,
            engagement: 0
          };
        }
        
        acc[date].impressions += record.impressions || 0;
        acc[date].likes += record.likes || 0;
        acc[date].shares += record.shares || 0;
        acc[date].comments += record.comments || 0;
        acc[date].clicks += record.clicks || 0;
        acc[date].engagement = acc[date].likes + acc[date].shares + acc[date].comments;
        
        return acc;
      }, {} as Record<string, any>) || {};

      return NextResponse.json({
        success: true,
        data: Object.values(timelineData)
      });

    } else if (type === 'platforms') {
      // Get platform-wise breakdown
      const { data, error } = await supabase
        .from('analytics')
        .select(`
          platform,
          impressions,
          likes,
          shares,
          comments,
          clicks
        `)
        .gte('recorded_at', dateFrom.toISOString());

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const platformData = data?.reduce((acc, record) => {
        const platform = record.platform;
        if (!acc[platform]) {
          acc[platform] = {
            platform,
            impressions: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            clicks: 0,
            engagement: 0,
            posts: 0
          };
        }
        
        acc[platform].impressions += record.impressions || 0;
        acc[platform].likes += record.likes || 0;
        acc[platform].shares += record.shares || 0;
        acc[platform].comments += record.comments || 0;
        acc[platform].clicks += record.clicks || 0;
        acc[platform].engagement = acc[platform].likes + acc[platform].shares + acc[platform].comments;
        acc[platform].posts += 1;
        
        return acc;
      }, {} as Record<string, any>) || {};

      return NextResponse.json({
        success: true,
        data: Object.values(platformData)
      });

    } else if (type === 'top_posts') {
      // Get top performing posts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          platform,
          posted_at,
          campaigns (
            name,
            tools (name)
          ),
          analytics (
            impressions,
            likes,
            shares,
            comments,
            clicks,
            engagement_rate
          )
        `)
        .eq('status', 'posted')
        .gte('posted_at', dateFrom.toISOString())
        .order('posted_at', { ascending: false })
        .limit(20);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Sort by engagement
      const sortedPosts = data?.map(post => ({
        ...post,
        totalEngagement: (post.analytics?.[0]?.likes || 0) + 
                        (post.analytics?.[0]?.shares || 0) + 
                        (post.analytics?.[0]?.comments || 0)
      })).sort((a, b) => b.totalEngagement - a.totalEngagement) || [];

      return NextResponse.json({
        success: true,
        data: sortedPosts.slice(0, 10)
      });
    }

    return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST - Record custom analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, platform, metrics } = body;

    if (!post_id || !platform || !metrics) {
      return NextResponse.json({ 
        error: 'post_id, platform, and metrics are required' 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('analytics')
      .upsert({
        post_id,
        platform,
        impressions: metrics.impressions || 0,
        likes: metrics.likes || 0,
        shares: metrics.shares || 0,
        comments: metrics.comments || 0,
        clicks: metrics.clicks || 0,
        reach: metrics.reach || 0,
        engagement_rate: metrics.engagement_rate || 0,
        click_through_rate: metrics.click_through_rate || 0,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT - Update analytics record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Analytics record ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('analytics')
      .update({
        ...updateData,
        recorded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Analytics PUT error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}