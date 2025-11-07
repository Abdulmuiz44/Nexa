"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Copy, Loader2 } from "lucide-react";

const ContentGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [platform, setPlatform] = useState("reddit");
  const [tone, setTone] = useState("professional");
  const [contentType, setContentType] = useState("post");
  const [generatedContent, setGeneratedContent] = useState("");

  const generateContent = async () => {
    if (!toolName.trim() || !toolDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both tool name and description",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setGeneratedContent("");

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName,
          toolDescription,
          websiteUrl,
          platform,
          tone,
          contentType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      console.log("Generated Content:", data.content); // For debugging
      setGeneratedContent(data.content);
      toast({
        title: "Content Generated!",
        description: "Your AI-generated content is ready and saved.",
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <Card className="bg-card/50 p-4 backdrop-blur-sm sm:p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Content Generator
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="toolName">Tool Name</Label>
            <Input
              id="toolName"
              placeholder="e.g., Nexa AI"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="toolDescription">Tool Description</Label>
            <Textarea
              id="toolDescription"
              placeholder="e.g., Nexa AI helps businesses automate their social media content creation."
              value={toolDescription}
              onChange={(e) => setToolDescription(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="websiteUrl">Website/App Link</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reddit">Reddit</SelectItem>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="contentType">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger id="contentType" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Single Post</SelectItem>
                <SelectItem value="reply">Reply/Comment</SelectItem>
                <SelectItem value="thread">Thread (3-5 posts)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={generateContent} 
            disabled={loading}
            className="w-full"
            variant="hero"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Output Display */}
      <Card className="bg-card/50 p-4 backdrop-blur-sm sm:p-6">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold">Generated Content</h3>
          {generatedContent && (
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          )}
        </div>
        <div className="relative rounded-xl border border-border/60 bg-secondary/30 p-4">
          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center text-center sm:min-h-[320px]">
              <div>
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI is crafting your content...</p>
              </div>
            </div>
          ) : generatedContent ? (
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed sm:text-base">
              {generatedContent}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center sm:min-h-[320px]">
              <Sparkles className="h-10 w-10 text-muted-foreground opacity-60" />
              <p className="text-sm text-muted-foreground sm:text-base">
                Fill in the details and tap generate to create AI-powered content.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ContentGenerator;