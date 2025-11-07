"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  platforms: string[];
  duration_days: number;
  posts_per_day: number;
  topic?: string;
  start_date?: string;
  end_date?: string;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        const campaign: Campaign = data.campaign;
        setFormData({
          name: campaign.name,
          description: campaign.description || "",
          platforms: campaign.platforms,
          duration_days: campaign.duration_days,
          posts_per_day: campaign.posts_per_day,
          topic: campaign.topic || "",
          start_date: campaign.start_date || "",
          end_date: campaign.end_date || "",
        });
      } else {
        alert("Failed to load campaign");
        router.push('/dashboard/campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      alert("Failed to load campaign");
      router.push('/dashboard/campaigns');
    } finally {
      setFetchLoading(false);
    }
  };

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
      alert("Campaign name is required");
      return;
    }

    if (formData.platforms.length === 0) {
      alert("At least one platform must be selected");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Campaign updated successfully!");
        router.push('/dashboard/campaigns');
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update campaign");
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert("Failed to update campaign");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
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
            <h1 className="text-3xl font-bold">Edit Campaign</h1>
            <p className="text-muted-foreground mt-1">
              Update your campaign settings
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
              </CardContent>
            </Card>
          </div>

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
              {loading ? 'Updating...' : 'Update Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
