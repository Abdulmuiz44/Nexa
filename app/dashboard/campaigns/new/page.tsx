"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platforms: [] as string[],
    duration_days: 7,
    posts_per_day: 1,
    topic: "",
    start_date: "",
    end_date: "",
  });

  const handlePlatformChange = (platform: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      platforms: checked
        ? [...prev.platforms, platform]
        : prev.platforms.filter(p => p !== platform)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: "Campaign name is required", variant: "destructive" });
      return;
    }

    if (formData.platforms.length === 0) {
      toast({ title: "At least one platform must be selected", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: "Campaign created", description: "Campaign created successfully!" });
        router.push('/dashboard/campaigns');
      } else {
        const error = await response.json();
        toast({ title: "Failed to create campaign", description: error.error || "Please try again.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({ title: "Failed to create campaign", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
            <p className="text-muted-foreground mt-1">
              Set up an automated social media campaign
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Weekly Tech Tips"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your campaign goals and strategy"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="topic">Topic/Focus</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., AI trends, product updates, industry news"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platforms & Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>Platforms & Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Platforms *</Label>
                  <div className="space-y-2 mt-2">
                    {[
                      { id: 'twitter', label: 'Twitter/X' },
                      { id: 'reddit', label: 'Reddit' },
                    ].map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={platform.id}
                          checked={formData.platforms.includes(platform.id)}
                          onCheckedChange={(checked) =>
                            handlePlatformChange(platform.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={platform.id}>{platform.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration_days">Duration (days)</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.duration_days}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        duration_days: parseInt(e.target.value) || 7
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="posts_per_day">Posts per Day</Label>
                    <Input
                      id="posts_per_day"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.posts_per_day}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        posts_per_day: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Posts:</span>
                  <div className="font-semibold">
                    {formData.duration_days * formData.posts_per_day}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Platforms:</span>
                  <div className="font-semibold">
                    {formData.platforms.length > 0 ? formData.platforms.join(', ') : 'None selected'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="font-semibold">{formData.duration_days} days</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Daily Posts:</span>
                  <div className="font-semibold">{formData.posts_per_day}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
