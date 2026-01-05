"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3, MessageSquare, Heart, Share2, Brain, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { PredictiveInsights } from "@/components/PredictiveInsights";
import { CompetitorAnalysis } from "@/components/CompetitorAnalysis";
import { ROITracking } from "@/components/ROITracking";
import { AutomatedRecommendations } from "@/components/AutomatedRecommendations";
import { useSession } from "next-auth/react";

interface Summary {
  timeframe: string;
  totalPosts: number;
  platforms: Record<string, any>;
  overall: { impressions: number; engagements: number; avgEngagementRate: number | null };
}

interface RecentPostItem {
  id: string;
  platform: string;
  content: string;
  published_at: string | null;
  url?: string | null;
  metrics: { impressions: number; engagements: number; likes: number; comments: number; shares: number; clicks: number };
}

interface LearningInsights {
  successful_patterns: string[];
  avoid_patterns: string[];
  last_updated: string | null;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentPostItem[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [learningLoading, setLearningLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    predictive: false,
    competitor: false,
    roi: false,
    recommendations: false,
  });

  useEffect(() => {
    const run = async () => {
      try {
        const s = await fetch('/api/analytics/summary?timeframe=month').then(r => r.json());
        if (s?.summary) setSummary(s.summary);
        const rp = await fetch('/api/analytics/recent-posts?limit=5').then(r => r.json());
        if (rp?.posts) setRecent(rp.posts);

        // Fetch learning insights
        await fetchLearningInsights();
      } catch (e) {
        console.error('Analytics fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const fetchLearningInsights = async () => {
    try {
      const response = await fetch('/api/analytics/learn');
      const data = await response.json();
      if (data?.learningData) {
        setLearningInsights(data.learningData);
      }
    } catch (e) {
      console.error('Learning insights fetch error', e);
    }
  };

  const runAnalyticsLearning = async () => {
    setLearningLoading(true);
    try {
      const response = await fetch('/api/analytics/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data?.learningData) {
        setLearningInsights(data.learningData);
      }
    } catch (e) {
      console.error('Learning analytics error', e);
    } finally {
      setLearningLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  // Safely derive overall average engagement rate for display
  const overallAvg = useMemo(() => {
    const val = summary?.overall?.avgEngagementRate;
    const num = typeof val === 'number' ? val : Number(val ?? 0);
    return Number.isFinite(num) ? num : 0;
  }, [summary]);

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
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
                <>
                  {overallAvg > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {overallAvg.toFixed(1)}%
                </>
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

        {/* Platform Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
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
          </div>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Avg Engagement Rate by Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(summary?.platforms || {}).map(([platform, data]: any) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm capitalize">{platform}</span>
                    <span className="font-medium">{Number(data?.avgEngagementRate ?? 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(100, Number(data?.avgEngagementRate ?? 0))} className="h-2" />
                </div>
              ))}
              {summary && Object.keys(summary.platforms).length === 0 && (
                <div className="text-sm text-muted-foreground">No data yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Learning Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Learning Insights
              </CardTitle>
              <Button
                onClick={runAnalyticsLearning}
                disabled={learningLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${learningLoading ? 'animate-spin' : ''}`} />
                Update Insights
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis of what works and what to avoid in your content
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {learningInsights?.last_updated && (
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(learningInsights.last_updated).toLocaleString()}
              </div>
            )}

            {/* Successful Patterns */}
            {learningInsights?.successful_patterns && learningInsights.successful_patterns.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  What Works Well
                </h4>
                <div className="space-y-2">
                  {learningInsights.successful_patterns.map((pattern, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patterns to Avoid */}
            {learningInsights?.avoid_patterns && learningInsights.avoid_patterns.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  What to Avoid
                </h4>
                <div className="space-y-2">
                  {learningInsights.avoid_patterns.map((pattern, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No insights yet */}
            {(!learningInsights?.successful_patterns?.length && !learningInsights?.avoid_patterns?.length) && (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No insights yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate some content and wait for engagement data to build AI learning insights.
                </p>
                <Button onClick={runAnalyticsLearning} disabled={learningLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${learningLoading ? 'animate-spin' : ''}`} />
                  Generate Insights
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Posts Performance (real) */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Recent Posts Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recent && recent.map((p) => (
                <a key={p.id} href={p.url || '#'} target={p.url ? '_blank' : undefined} rel={p.url ? 'noopener noreferrer' : undefined} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1 line-clamp-1">{p.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">{p.platform}</span>
                      <span>{p.published_at ? new Date(p.published_at).toLocaleString() : '—'}</span>
                      {p.url && <span className="text-primary underline underline-offset-4">Open</span>}
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
                </a>
              ))}

              {!loading && recent && recent.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No recent published posts</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Sections */}
      <div className="space-y-6 mt-8">
        {/* Predictive Insights */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('predictive')}
              className="w-full justify-between p-0 h-auto"
            >
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Predictive Insights
              </CardTitle>
              {expandedSections.predictive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <p className="text-sm text-muted-foreground">
              AI-powered predictions to optimize your strategy
            </p>
          </CardHeader>
          {expandedSections.predictive && (
            <CardContent className="pt-0">
              {userId && <PredictiveInsights userId={userId} />}
            </CardContent>
          )}
        </Card>

        {/* Competitor Analysis */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('competitor')}
              className="w-full justify-between p-0 h-auto"
            >
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Competitor Analysis
              </CardTitle>
              {expandedSections.competitor ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <p className="text-sm text-muted-foreground">
              Track competitor performance and learn from their strategies
            </p>
          </CardHeader>
          {expandedSections.competitor && (
            <CardContent className="pt-0">
              {userId && <CompetitorAnalysis userId={userId} />}
            </CardContent>
          )}
        </Card>

        {/* ROI Tracking */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('roi')}
              className="w-full justify-between p-0 h-auto"
            >
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ROI Tracking
              </CardTitle>
              {expandedSections.roi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <p className="text-sm text-muted-foreground">
              Measure the return on investment from your campaigns
            </p>
          </CardHeader>
          {expandedSections.roi && (
            <CardContent className="pt-0">
              {userId && <ROITracking userId={userId} />}
            </CardContent>
          )}
        </Card>

        {/* Automated Recommendations */}
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => toggleSection('recommendations')}
              className="w-full justify-between p-0 h-auto"
            >
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
              {expandedSections.recommendations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <p className="text-sm text-muted-foreground">
              Automated insights to optimize your social media strategy
            </p>
          </CardHeader>
          {expandedSections.recommendations && (
            <CardContent className="pt-0">
              {userId && <AutomatedRecommendations userId={userId} />}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
