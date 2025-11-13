"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, TrendingDown, Target, Plus, Search, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface Competitor {
  id: string;
  name: string;
  handle: string;
  platform: 'twitter' | 'reddit';
  avatar?: string;
  followers: number;
  recentActivity: {
    posts: number;
    engagement: number;
    growth: number; // percentage
  };
  topTopics: string[];
  postingPatterns: {
    bestDays: string[];
    bestTimes: string[];
    frequency: string;
  };
  engagementRate: number;
  lastAnalyzed: string;
}

interface CompetitorAnalysisProps {
  userId: string;
}

export function CompetitorAnalysis({ userId }: CompetitorAnalysisProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [newCompetitorHandle, setNewCompetitorHandle] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'reddit'>('twitter');

  useEffect(() => {
    fetchCompetitors();
  }, [userId]);

  const fetchCompetitors = async () => {
    try {
      const response = await fetch('/api/analytics/competitors');
      const data = await response.json();
      if (data.competitors) {
        setCompetitors(data.competitors);
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = async () => {
    if (!newCompetitorHandle.trim()) return;

    setAddingCompetitor(true);
    try {
      const response = await fetch('/api/analytics/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: newCompetitorHandle.trim(),
          platform: selectedPlatform,
          userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCompetitors();
        setNewCompetitorHandle('');
      }
    } catch (error) {
      console.error('Failed to add competitor:', error);
    } finally {
      setAddingCompetitor(false);
    }
  };

  const removeCompetitor = async (competitorId: string) => {
    try {
      await fetch(`/api/analytics/competitors/${competitorId}`, {
        method: 'DELETE',
      });
      setCompetitors(competitors.filter(c => c.id !== competitorId));
    } catch (error) {
      console.error('Failed to remove competitor:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Competitor Analysis
          </CardTitle>
          <Button
            onClick={fetchCompetitors}
            variant="outline"
            size="sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Track competitor performance and learn from their strategies
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Competitor Section */}
        <div className="border rounded-lg p-4 bg-accent/20">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Competitor to Track
          </h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="competitor-handle" className="sr-only">Competitor Handle</Label>
              <Input
                id="competitor-handle"
                placeholder="@username or r/subreddit"
                value={newCompetitorHandle}
                onChange={(e) => setNewCompetitorHandle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
              />
            </div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as 'twitter' | 'reddit')}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="twitter">Twitter</option>
              <option value="reddit">Reddit</option>
            </select>
            <Button
              onClick={addCompetitor}
              disabled={addingCompetitor || !newCompetitorHandle.trim()}
            >
              {addingCompetitor ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>

        {/* Competitors List */}
        {competitors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No competitors added yet</h3>
            <p className="text-muted-foreground">
              Add competitors to track their performance and learn from their strategies.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={competitor.avatar} />
                      <AvatarFallback>
                        {competitor.platform === 'twitter' ? '@' : 'r/'}
                        {competitor.handle[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{competitor.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {competitor.platform === 'twitter' ? '@' : 'r/'}{competitor.handle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatNumber(competitor.followers)}</div>
                    <div className="text-xs text-muted-foreground">followers</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{competitor.recentActivity.posts}</div>
                    <div className="text-xs text-muted-foreground">Posts (30d)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{competitor.engagementRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                      competitor.recentActivity.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {competitor.recentActivity.growth > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(competitor.recentActivity.growth)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatNumber(competitor.recentActivity.engagement)}</div>
                    <div className="text-xs text-muted-foreground">Total Engagement</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Top Topics</h5>
                    <div className="flex flex-wrap gap-1">
                      {competitor.topTopics.slice(0, 5).map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Posting Patterns</h5>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Best days: {competitor.postingPatterns.bestDays.join(', ')}</div>
                      <div>Best times: {competitor.postingPatterns.bestTimes.join(', ')}</div>
                      <div>Frequency: {competitor.postingPatterns.frequency}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Last analyzed: {new Date(competitor.lastAnalyzed).toLocaleDateString()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCompetitor(competitor.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
