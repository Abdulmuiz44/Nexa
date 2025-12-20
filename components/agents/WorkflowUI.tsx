'use client';

import { useState } from 'react';
import { useStreamingAgent } from '@/hooks/useStreamingAgent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

const PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'linkedin', label: 'LinkedIn' },
];

export function WorkflowUI() {
  const { loading, error, state, startWorkflow, stopWorkflow, reset } = useStreamingAgent();

  const [brief, setBrief] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter']);

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleStart = async () => {
    if (!brief.trim()) {
      alert('Please enter a content brief');
      return;
    }

    try {
      await startWorkflow(brief.trim(), selectedPlatforms);
    } catch (err) {
      console.error('Workflow error:', err);
    }
  };

  const currentPhase = () => {
    if (!loading && state.published) return 'published';
    if (!loading && state.contentVariations) return 'generated';
    if (loading) return 'running';
    return 'idle';
  };

  const phase = currentPhase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Social Media Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Generate content, publish to multiple platforms, and track engagement in real-time
        </p>
      </div>

      {/* Status Indicator */}
      <Card
        className={`border-l-4 ${
          phase === 'idle'
            ? 'border-l-blue-500'
            : phase === 'running'
              ? 'border-l-yellow-500'
              : phase === 'generated'
                ? 'border-l-orange-500'
                : 'border-l-green-500'
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {phase === 'running' && <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />}
              {phase === 'generated' && <Zap className="h-5 w-5 text-orange-500" />}
              {phase === 'published' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {phase === 'idle' && <div className="h-5 w-5 rounded-full bg-blue-500" />}
              <div>
                <CardTitle className="text-lg">
                  {phase === 'idle' && 'Ready'}
                  {phase === 'running' && 'Workflow Running'}
                  {phase === 'generated' && 'Content Generated'}
                  {phase === 'published' && 'Published Successfully'}
                </CardTitle>
                <CardDescription>
                  {phase === 'idle' && 'Configure and start your workflow'}
                  {phase === 'running' && 'Processing your request...'}
                  {phase === 'generated' && 'Ready to publish'}
                  {phase === 'published' && 'All posts published and tracked'}
                </CardDescription>
              </div>
            </div>
            {loading && (
              <Button variant="destructive" size="sm" onClick={stopWorkflow}>
                Stop
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Input Section */}
      {!loading && phase === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Workflow</CardTitle>
            <CardDescription>Define what content you want to create and where to post it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Brief */}
            <div>
              <label className="text-sm font-medium">Content Brief *</label>
              <Textarea
                placeholder="What would you like to post about? (e.g., 'Announce our new AI-powered scheduling feature')"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                disabled={loading}
                className="mt-2 min-h-24"
              />
              <p className="text-xs text-muted-foreground mt-1">Be specific for better content</p>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Target Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => (
                  <Button
                    key={platform.value}
                    variant={selectedPlatforms.includes(platform.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePlatformToggle(platform.value)}
                    disabled={loading}
                  >
                    {platform.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={reset}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                onClick={handleStart}
                disabled={loading || !brief.trim() || selectedPlatforms.length === 0}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  'Start Workflow'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Log */}
      {state.executionLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Execution Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
              {state.executionLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    log.includes('✓')
                      ? 'bg-green-50 text-green-700'
                      : log.includes('✗')
                        ? 'bg-red-50 text-red-700'
                        : log.includes('ℹ')
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Content */}
      {state.contentVariations &&
        Object.entries(state.contentVariations)
          .filter(([key]) => key !== 'metadata' && key !== 'analysis')
          .map(([platform, content]) => (
            <Card key={platform}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize text-lg">{platform} Content</CardTitle>
                  <div className="flex gap-2">
                    {state.postIds && state.postIds.length > 0 && (
                      <Badge variant="default" className="bg-green-600">
                        Published
                      </Badge>
                    )}
                    <Badge variant="secondary">{platform}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-muted-foreground">
                    <span className="font-semibold">Characters:</span>{' '}
                    {typeof content === 'string' ? content.length : 0}
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-semibold">Status:</span> Ready
                  </div>
                  <div className="text-muted-foreground">
                    <span className="font-semibold">Platform:</span> {platform}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

      {/* Content Analysis */}
      {state.contentVariations?.analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Content Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {state.contentVariations.analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      {state.metrics && Object.keys(state.metrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Engagement Metrics
            </CardTitle>
            <CardDescription>Real-time performance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(state.metrics).map(([postId, metrics]: [string, any]) => (
                <div key={postId} className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-3 truncate">
                    Post {postId.slice(0, 8)}...
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: 'Likes', value: metrics.likes, color: 'text-red-500' },
                      { label: 'Comments', value: metrics.comments, color: 'text-blue-500' },
                      { label: 'Shares', value: metrics.shares, color: 'text-green-500' },
                      { label: 'Views', value: metrics.views, color: 'text-purple-500' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className={`text-sm font-semibold ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-600">Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {phase === 'idle' && state.executionLog.length === 0 && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">No Workflows Yet</h3>
            <p className="text-sm text-muted-foreground">
              Create your first workflow to generate, publish, and track content across multiple platforms.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
