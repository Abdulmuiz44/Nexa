'use client';

import { useState } from 'react';
import { useContentAgent } from '@/hooks/useContentAgent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
];

export function ContentAgentUI() {
  const { loading, error, result, executionLog, generateContent, reset } = useContentAgent();

  const [brief, setBrief] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter']);
  const [tone, setTone] = useState<'professional' | 'casual' | 'humorous'>('professional');
  const [additionalContext, setAdditionalContext] = useState('');

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleGenerate = async () => {
    if (!brief.trim()) {
      alert('Please enter a content brief');
      return;
    }

    try {
      await generateContent({
        brief: brief.trim(),
        toolkits: selectedPlatforms,
        tone,
        additionalContext: additionalContext.trim() || undefined,
      });
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Content Generation Agent</CardTitle>
          <CardDescription>Generate platform-specific social media content using AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brief Input */}
          <div>
            <label className="text-sm font-medium">Content Brief *</label>
            <Textarea
              placeholder="What content would you like to create? (e.g., 'Announce our new AI feature for social media scheduling')"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              disabled={loading}
              className="mt-2 min-h-20"
            />
          </div>

          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Platforms</label>
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
          </div>

          {/* Tone Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Button
                  key={t.value}
                  variant={tone === t.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTone(t.value as 'professional' | 'casual' | 'humorous')}
                  disabled={loading}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Context */}
          <div>
            <label className="text-sm font-medium">Additional Context (Optional)</label>
            <Input
              placeholder="Any specific keywords, hashtags, or constraints?"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              disabled={loading}
              className="mt-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            {result && (
              <Button variant="outline" onClick={reset} disabled={loading}>
                Reset
              </Button>
            )}
            <Button onClick={handleGenerate} disabled={loading || !brief.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Content'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {executionLog.map((log, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  {log}
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
            <CardTitle className="text-lg text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          {/* Generated Content */}
          {Object.entries(result).map(
            ([platform, content]) =>
              platform !== 'metadata' &&
              platform !== 'analysis' && (
                <Card key={platform}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize flex items-center gap-2">
                      {platform}
                      <Badge variant="secondary">{platform}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                      {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                    </p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Length: {typeof content === 'string' ? content.length : 'N/A'} characters
                    </div>
                  </CardContent>
                </Card>
              )
          )}

          {/* Analysis */}
          {result.analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{result.analysis}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {result.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Metadata</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Model:</span> {result.metadata.model}
                </div>
                <div>
                  <span className="font-medium">Tokens Used:</span> {result.metadata.tokensUsed}
                </div>
                <div>
                  <span className="font-medium">Generated:</span>{' '}
                  {new Date(result.metadata.generatedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
