'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RepurposePage() {
  const [sourceType, setSourceType] = useState('article');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [step, setStep] = useState<'import' | 'generate' | 'results'>('import');
  const [sourceId, setSourceId] = useState('');

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/repurpose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'import',
          source_type: sourceType,
          title,
          content,
          source_url: sourceUrl
        })
      });
      const data = await res.json();
      setSourceId(data.source.id);
      setStep('generate');
    } catch (error) {
      console.error('Error importing content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/repurpose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'generate',
          source_id: sourceId,
          num_posts: 10
        })
      });
      const data = await res.json();
      setGeneratedPosts(data.posts || []);
      setStep('results');
    } catch (error) {
      console.error('Error generating posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Repurposing</h1>
        <p className="text-muted-foreground">
          Turn one piece of content into 10+ social media posts
        </p>
      </div>

      {step === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle>Import Content</CardTitle>
            <CardDescription>
              Paste your blog post, article, or any long-form content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-type">Content Type</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="youtube">YouTube Video</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your content here..."
                className="min-h-[300px]"
              />
            </div>

            <Button onClick={handleImport} disabled={!title || !content || loading} className="w-full">
              {loading ? 'Processing...' : 'Import & Analyze'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'generate' && (
        <Card>
          <CardHeader>
            <CardTitle>Content Analyzed!</CardTitle>
            <CardDescription>
              Ready to generate social media posts from your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              We've extracted key points from "{title}". Now let's turn them into engaging social posts.
            </p>
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate 10 Posts'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'results' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Posts ({generatedPosts.length})</CardTitle>
              <CardDescription>
                Ready to schedule or edit these posts
              </CardDescription>
            </CardHeader>
          </Card>

          {generatedPosts.map((post, idx) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    Post {idx + 1} - {post.angle}
                  </CardTitle>
                  <Button size="sm" variant="outline">Schedule</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{post.generated_content}</p>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              setStep('import');
              setTitle('');
              setContent('');
              setSourceUrl('');
              setGeneratedPosts([]);
            }}
            className="w-full"
          >
            Import More Content
          </Button>
        </div>
      )}
    </div>
  );
}
