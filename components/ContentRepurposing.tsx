"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Recycle, Link as LinkIcon, FileText, Video, Image, Copy, Download, Share2, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface RepurposedContent {
  id: string;
  originalUrl: string;
  contentType: 'blog' | 'video' | 'article' | 'webpage';
  title: string;
  summary: string;
  socialPosts: SocialPost[];
  createdAt: string;
  status: 'processing' | 'completed' | 'failed';
}

interface SocialPost {
  platform: 'twitter' | 'reddit' | 'linkedin';
  content: string;
  hashtags: string[];
  characterCount: number;
  tone: string;
}

interface ContentRepurposingProps {
  userId: string;
}

const getContentTypeIcon = (type: string) => {
  switch (type) {
    case 'blog': return FileText;
    case 'video': return Video;
    case 'article': return FileText;
    default: return LinkIcon;
  }
};

export function ContentRepurposing({ userId }: ContentRepurposingProps) {
  const [repurposedContent, setRepurposedContent] = useState<RepurposedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [repurposing, setRepurposing] = useState(false);
  const [selectedContent, setSelectedContent] = useState<RepurposedContent | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchRepurposedContent();
  }, [userId]);

  const fetchRepurposedContent = async () => {
    try {
      const response = await fetch('/api/content/repurpose');
      const data = await response.json();
      if (data.content) {
        setRepurposedContent(data.content);
      }
    } catch (error) {
      console.error('Failed to fetch repurposed content:', error);
    } finally {
      setLoading(false);
    }
  };

  const repurposeContent = async (url: string, contentType: string) => {
    setRepurposing(true);
    try {
      const response = await fetch('/api/content/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, contentType, userId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchRepurposedContent();
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Failed to repurpose content:', error);
    } finally {
      setRepurposing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadContent = (content: RepurposedContent) => {
    const data = {
      originalUrl: content.originalUrl,
      title: content.title,
      summary: content.summary,
      socialPosts: content.socialPosts,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_repurposed.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Recycle className="h-5 w-5" />
            Content Repurposing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
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
            <Recycle className="h-5 w-5" />
            Content Repurposing
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <LinkIcon className="h-4 w-4 mr-2" />
                Repurpose Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Repurpose Content</DialogTitle>
              </DialogHeader>
              <RepurposeContentForm onSubmit={repurposeContent} loading={repurposing} />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          Transform your blog posts, videos, and articles into optimized social media content
        </p>
      </CardHeader>
      <CardContent>
        {repurposedContent.length === 0 ? (
          <div className="text-center py-8">
            <Recycle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No repurposed content yet</h3>
            <p className="text-muted-foreground mb-4">
              Transform your existing content into social media posts that drive engagement.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Start Repurposing
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All ({repurposedContent.length})</TabsTrigger>
                <TabsTrigger value="blogs">Blogs</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="articles">Articles</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {repurposedContent.map((content) => (
                  <ContentCard
                    key={content.id}
                    content={content}
                    onView={() => setSelectedContent(content)}
                    onDownload={() => downloadContent(content)}
                  />
                ))}
              </TabsContent>

              {['blogs', 'videos', 'articles'].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4">
                  {repurposedContent
                    .filter(content => content.contentType === type.slice(0, -1))
                    .map((content) => (
                      <ContentCard
                        key={content.id}
                        content={content}
                        onView={() => setSelectedContent(content)}
                        onDownload={() => downloadContent(content)}
                      />
                    ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Content Details Dialog */}
        {selectedContent && (
          <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Recycle className="h-5 w-5" />
                  {selectedContent.title}
                </DialogTitle>
              </DialogHeader>
              <ContentDetails content={selectedContent} onCopy={copyToClipboard} />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function ContentCard({ content, onView, onDownload }: {
  content: RepurposedContent;
  onView: () => void;
  onDownload: () => void;
}) {
  const IconComponent = getContentTypeIcon(content.contentType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{content.title}</h4>
              <Badge className={getStatusColor(content.status)}>
                {content.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {content.summary}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{content.socialPosts.length} posts generated</span>
              <span>{new Date(content.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            View Posts
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ContentDetails({ content, onCopy }: { content: RepurposedContent; onCopy: (text: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-accent/20 rounded-lg">
        <h4 className="font-medium mb-2">Original Content</h4>
        <p className="text-sm text-muted-foreground mb-2">{content.summary}</p>
        <a
          href={content.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          {content.originalUrl}
        </a>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Generated Social Posts</h4>
        {content.socialPosts.map((post, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {post.platform}
                </Badge>
                <Badge variant="secondary">
                  {post.characterCount} chars
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(post.content)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>

            <p className="text-sm mb-3">{post.content}</p>

            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((hashtag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    #{hashtag}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function RepurposeContentForm({ onSubmit, loading }: {
  onSubmit: (url: string, contentType: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<'blog' | 'video' | 'article' | 'webpage'>('blog');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim(), contentType);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="content-url">Content URL</Label>
        <Input
          id="content-url"
          type="url"
          placeholder="https://yourblog.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter the URL of your blog post, video, or article
        </p>
      </div>

      <div>
        <Label htmlFor="content-type">Content Type</Label>
        <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog">Blog Post</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="article">News Article</SelectItem>
            <SelectItem value="webpage">Web Page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-spin" />
              Repurposing...
            </>
          ) : (
            <>
              <Recycle className="h-4 w-4 mr-2" />
              Repurpose Content
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
