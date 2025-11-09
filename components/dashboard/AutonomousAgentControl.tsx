'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Activity, TrendingUp, Twitter, MessageCircle } from 'lucide-react';

interface AgentStatus {
  isRunning: boolean;
  status: string;
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
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState<TweetPattern | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(false);

  useEffect(() => {
    fetchAgentStatus();
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent/autonomous');
      const data = await response.json();
      setAgentStatus(data);
    } catch (error) {
      console.error('Error fetching agent status:', error);
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

          {agentStatus.isRunning && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 animate-pulse text-green-500" />
                Agent is Active
              </h4>
              <p className="text-sm text-muted-foreground">
                Your autonomous agent is monitoring, creating, and engaging with content on your behalf.
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>✓ Analyzing engagement opportunities</li>
                <li>✓ Generating content in your style</li>
                <li>✓ Auto-posting on schedule</li>
                <li>✓ Auto-engaging with relevant content</li>
              </ul>
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
