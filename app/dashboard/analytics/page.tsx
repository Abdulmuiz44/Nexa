"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, MessageSquare, Heart, Share2 } from "lucide-react";

interface Summary {
  timeframe: string;
  totalPosts: number;
  platforms: Record<string, any>;
  overall: { impressions: number; engagements: number; avgEngagementRate: number };
}

interface RecentPostItem {
  id: string;
  platform: string;
  content: string;
  published_at: string | null;
  url?: string | null;
  metrics: { impressions: number; engagements: number; likes: number; comments: number; shares: number; clicks: number };
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const s = await fetch('/api/analytics/summary?timeframe=month').then(r => r.json());
        if (s?.summary) setSummary(s.summary);
        const rp = await fetch('/api/analytics/recent-posts?limit=5').then(r => r.json());
        if (rp?.posts) setRecent(rp.posts);
      } catch (e) {
        console.error('Analytics fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const platformPercentages = useMemo(() => {
    if (!summary || !summary.platforms) return { twitter: 0, reddit: 0 } as Record<string, number>;
    const totalEng = Object.values(summary.platforms).reduce((sum: number, p: any) => sum + (p.engagements || 0), 0) || 0;
    const result: Record<string, number> = {};
    Object.entries(summary.platforms).forEach(([k, v]: any) => {
      result[k] = totalEng > 0 ? Math.round(((v.engagements || 0) / totalEng) * 100) : 0;
    });
    return result;
  }, [summary]);

  const totalShares = useMemo(() => {
    if (!summary) return 0;
    return Object.values(summary.platforms || {}).reduce((sum: number, p: any) => sum + (p.shares || 0), 0);
  }, [summary]);

  const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">Track your social media performance and engagement metrics</p>
        </div>

        {/* Key Metrics (real) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary" className="text-green-600">
                {summary && summary.overall.avgEngagementRate >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {summary.overall.avgEngagementRate.toFixed(1)}%
                  </>
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{summary ? fmt(summary.overall.impressions) : (loading ? '—' : '0')}</div>
            <div className="text-sm text-muted-foreground">Total Impressions</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{summary ? fmt(summary.totalPosts) : (loading ? '—' : '0')}</div>
            <div className="text-sm text-muted-foreground">Posts This Period</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{summary ? fmt(summary.overall.engagements) : (loading ? '—' : '0')}</div>
            <div className="text-sm text-muted-foreground">Total Engagement</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Share2 className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{summary ? fmt(totalShares) : (loading ? '—' : '0')}</div>
            <div className="text-sm text-muted-foreground">Shares/Retweets</div>
          </Card>
        </div>

        {/* Platform Performance (real) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Platform Engagement Share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(summary?.platforms || { twitter: {}, reddit: {} }).map((platform) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${platform === 'twitter' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                      <span className="font-medium capitalize">{platform}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{platformPercentages[platform] ?? 0}%</div>
                      <div className="text-sm text-muted-foreground">of engagement</div>
                    </div>
                  </div>
                  <Progress value={platformPercentages[platform] ?? 0} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Avg Engagement Rate by Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(summary?.platforms || {}).map(([platform, data]: any) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm capitalize">{platform}</span>
                    <span className="font-medium">{(data.avgEngagementRate || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(100, data.avgEngagementRate || 0)} className="h-2" />
                </div>
              ))}
              {summary && Object.keys(summary.platforms).length === 0 && (
                <div className="text-sm text-muted-foreground">No data yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts Performance (real) */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Recent Posts Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1 line-clamp-1">{p.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">{p.platform}</span>
                      <span>{p.published_at ? new Date(p.published_at).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold">{fmt(p.metrics.likes)}</div>
                      <div className="text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{fmt(p.metrics.comments)}</div>
                      <div className="text-muted-foreground">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{fmt(p.metrics.shares)}</div>
                      <div className="text-muted-foreground">Shares</div>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && recent.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No recent published posts</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
