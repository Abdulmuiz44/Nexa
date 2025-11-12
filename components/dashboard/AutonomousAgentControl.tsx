'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Square, Activity, TrendingUp, Twitter, MessageCircle, Clock, Zap, BarChart3 } from 'lucide-react';

interface AgentStatus {
  isRunning: boolean;
  status: string;
}

interface AgentTelemetry {
  isRunning: boolean;
  status: string;
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
    metadata?: any;
  }>;
  pendingPosts: Array<{
    id: string;
    platform: string;
    scheduled_at: string;
    status: string;
  }>;
  engagementStats: {
    posts_today: number;
    total_posts: number;
  };
}

interface TweetPattern {
  common_hooks: string[];
  typical_structure: string;
  voice_characteristics: string;
  engagement_patterns: {
    best_time: string;
    best_day: string;
    avg_engagement: number;
  };
  content_themes: string[];
}

export function AutonomousAgentControl() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({ isRunning: false, status: 'stopped' });
  const [telemetry, setTelemetry] = useState<AgentTelemetry | null>(null);
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<TweetPattern | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(false);

  useEffect(() => {
    fetchAgentStatus();
    fetchTelemetry();

    // Set up polling for live updates
    const interval = setInterval(() => {
      if (agentStatus.isRunning) {
        fetchTelemetry();
      }
    }, 30000); // Update every 30 seconds when running

    return () => clearInterval(interval);
  }, [agentStatus.isRunning]);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent/autonomous');
      const data = await response.json();
      setAgentStatus(data);
    } catch (error) {
      console.error('Error fetching agent status:', error);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/agent/telemetry');
      const data = await response.json();
      setTelemetry(data);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    }
  };

  const startAgent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent/autonomous', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setAgentStatus({ isRunning: true, status: 'active' });
        fetchTelemetry(); // Refresh telemetry immediately
      }
    } catch (error) {
      console.error('Error starting agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopAgent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agent/autonomous', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setAgentStatus({ isRunning: false, status: 'stopped' });
      }
    } catch (error) {
      console.error('Error stopping agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePatterns = async () => {
    setPatternsLoading(true);
    try {
      const response = await fetch('/api/twitter/patterns');
      const data = await response.json();

      if (data.success) {
        setPatterns(data.patterns);
      }
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    } finally {
      setPatternsLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'auto_tweet_posted': return Twitter;
      case 'auto_reddit_post': return MessageCircle;
      case 'auto_like': return '👍';
      case 'auto_retweet': return '🔄';
      case 'auto_reply': return MessageCircle;
      case 'agent_started': return Play;
      case 'agent_stopped': return Square;
      default: return Activity;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'auto_tweet_posted':
      case 'auto_reddit_post': return 'text-blue-500';
      case 'auto_like':
      case 'auto_retweet':
      case 'auto_reply': return 'text-green-500';
      case 'agent_started': return 'text-green-600';
      case 'agent_stopped': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Autonomous Agent Control
          </CardTitle>
          <CardDescription>
            Manage your AI-powered social media automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Agent Status</p>
              <Badge variant={agentStatus.isRunning ? "default" : "secondary"}>
                {agentStatus.status}
              </Badge>
            </div>

            <div className="flex gap-2">
              {!agentStatus.isRunning ? (
                <Button onClick={startAgent} disabled={loading}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Agent
                </Button>
              ) : (
                <Button onClick={stopAgent} disabled={loading} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Agent
                </Button>
              )}
            </div>
          </div>

          {agentStatus.isRunning && telemetry && (
            <div className="rounded-lg bg-muted p-4 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 animate-pulse text-green-500" />
                Agent is Active
              </h4>

              {/* Live Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-500">{telemetry.engagementStats.posts_today}</div>
                  <div className="text-xs text-muted-foreground">Posts Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500">{telemetry.pendingPosts.length}</div>
                  <div className="text-xs text-muted-foreground">Queued Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-500">{telemetry.engagementStats.total_posts}</div>
                  <div className="text-xs text-muted-foreground">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-500">{telemetry.recentActivity.length}</div>
                  <div className="text-xs text-muted-foreground">Recent Actions</div>
                </div>
              </div>

              {/* Recent Activity */}
              {telemetry.recentActivity.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Recent Activity</h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {telemetry.recentActivity.slice(0, 5).map((activity) => {
                      const Icon = getActivityIcon(activity.action);
                      return (
                        <div key={activity.id} className="flex items-center gap-2 text-xs">
                          <div className={getActivityColor(activity.action)}>
                            {typeof Icon === 'string' ? Icon : <Icon className="h-3 w-3" />}
                          </div>
                          <span className="flex-1 truncate">{activity.description}</span>
                          <span className="text-muted-foreground">
                            {new Date(activity.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending Posts */}
              {telemetry.pendingPosts.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2">Upcoming Posts</h5>
                  <div className="space-y-1">
                    {telemetry.pendingPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{post.platform} post scheduled for</span>
                        <span className="font-medium">
                          {new Date(post.scheduled_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            Your Tweet Patterns
          </CardTitle>
          <CardDescription>
            AI-analyzed characteristics of your Twitter presence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!patterns ? (
            <div className="text-center py-6">
              <Button onClick={analyzePatterns} disabled={patternsLoading}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyze My Patterns
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will analyze your recent tweets to understand your style
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Voice Characteristics</h4>
                <p className="text-sm text-muted-foreground">{patterns.voice_characteristics}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Common Hooks</h4>
                <div className="flex flex-wrap gap-2">
                  {patterns.common_hooks.map((hook, i) => (
                    <Badge key={i} variant="outline">{hook}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Typical Structure</h4>
                <p className="text-sm text-muted-foreground">{patterns.typical_structure}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Content Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {patterns.content_themes.map((theme, i) => (
                    <Badge key={i} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Best Engagement Times</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Best Day:</span>
                    <span className="ml-2 font-medium">{patterns.engagement_patterns.best_day}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Best Time:</span>
                    <span className="ml-2 font-medium">{patterns.engagement_patterns.best_time}</span>
                  </div>
                </div>
              </div>

              <Button onClick={analyzePatterns} variant="outline" size="sm" disabled={patternsLoading}>
                Re-analyze Patterns
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
