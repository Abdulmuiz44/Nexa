'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PerformancePage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/insights?action=dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading performance data...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Performance Intelligence</h1>
        <p className="text-muted-foreground">
          AI-powered insights to optimize your content strategy
        </p>
      </div>

      {/* Insights Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {dashboardData?.insights?.map((insight: any, idx: number) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg">{insight.title}</CardTitle>
              <CardDescription>
                Confidence: {Math.round(insight.confidence_score * 100)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{insight.description}</p>
              {insight.action_recommendation && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">💡 Recommendation:</p>
                  <p className="text-sm mt-1">{insight.action_recommendation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Best Posting Times */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Best Posting Times</CardTitle>
          <CardDescription>Optimal hours for maximum engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {dashboardData?.bestPostingTimes?.map((time: any) => (
              <div
                key={time.hour}
                className="text-center p-2 rounded bg-muted"
                style={{
                  opacity: 0.3 + (time.engagement_rate * 0.7)
                }}
              >
                <div className="text-xs font-medium">{time.hour}:00</div>
                <div className="text-xs text-muted-foreground">
                  {(time.engagement_rate * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Type Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Content Type Performance</CardTitle>
          <CardDescription>Which formats work best for your audience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData?.contentTypePerformance?.map((type: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium capitalize">{type.type}</p>
                  <p className="text-sm text-muted-foreground">{type.count} posts</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{(type.avg_engagement * 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Avg engagement</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Trends</CardTitle>
          <CardDescription>Your performance over the last 4 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dashboardData?.weeklyMetrics?.map((week: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-medium">{week.period_start} to {week.period_end}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posts</p>
                    <p className="font-medium">{week.total_posts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="font-medium">{week.total_impressions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <p className="font-medium">{(week.avg_engagement_rate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
