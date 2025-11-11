'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function EngagePage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [oppRes, statsRes] = await Promise.all([
        fetch('/api/engagement?action=opportunities&min_score=70', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/engagement?action=stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const oppData = await oppRes.json();
      const statsData = await statsRes.json();

      setOpportunities(oppData.opportunities || []);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEngage = async (opportunityId: string, action: string) => {
    try {
      await fetch('/api/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'engage',
          opportunity_id: opportunityId,
          engagement_action: action
        })
      });
      fetchData();
    } catch (error) {
      console.error('Error engaging:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading engagement opportunities...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Engagement</h1>
        <p className="text-muted-foreground">
          Find and engage with relevant conversations
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total_opportunities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Engaged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.engaged_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pending_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg Relevance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{Math.round(stats.avg_relevance_score)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opportunities */}
      <div className="space-y-4">
        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No engagement opportunities found. We'll find relevant conversations for you soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          opportunities.map((opp) => (
            <Card key={opp.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{opp.platform.toUpperCase()}</Badge>
                      <Badge variant="outline">{opp.opportunity_type}</Badge>
                      <Badge variant="secondary">Score: {opp.relevance_score}</Badge>
                    </div>
                    <CardDescription>
                      {opp.author_username && `@${opp.author_username}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{opp.content}</p>
                </div>

                {opp.suggested_response && (
                  <div className="p-4 border-l-4 border-primary bg-primary/5 rounded">
                    <p className="text-sm font-medium mb-1">Suggested Response:</p>
                    <p className="text-sm">{opp.suggested_response}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => handleEngage(opp.id, 'like')} variant="outline">
                    👍 Like
                  </Button>
                  <Button onClick={() => handleEngage(opp.id, 'reply')} className="flex-1">
                    💬 Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
