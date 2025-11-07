"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, Edit, Trash2, Play, Pause, MoreHorizontal } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Campaign {
id: string;
name: string;
description?: string;
platforms: string[];
status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
duration_days: number;
posts_per_day: number;
topic?: string;
created_at: string;
  start_date?: string;
end_date?: string;
}

export default function CampaignsPage() {
const [campaigns, setCampaigns] = useState<Campaign[]>([]);
const [loading, setLoading] = useState(true);
const router = useRouter();

useEffect(() => {
fetchCampaigns();
}, []);

const fetchCampaigns = async () => {
try {
const response = await fetch('/api/campaigns');
if (response.ok) {
const data = await response.json();
setCampaigns(data.campaigns || []);
}
} catch (error) {
console.error('Error fetching campaigns:', error);
} finally {
      setLoading(false);
}
};

const getStatusColor = (status: string) => {
switch (status) {
case 'active': return 'bg-green-500';
case 'draft': return 'bg-gray-500';
case 'paused': return 'bg-yellow-500';
case 'completed': return 'bg-blue-500';
case 'cancelled': return 'bg-red-500';
default: return 'bg-gray-500';
}
};

const getStatusIcon = (status: string) => {
switch (status) {
case 'active': return <Play className="h-3 w-3" />;
case 'paused': return <Pause className="h-3 w-3" />;
default: return null;
}
  };

const handleCreateCampaign = () => {
router.push('/dashboard/campaigns/new');
};

const handleEditCampaign = (campaignId: string) => {
router.push(`/dashboard/campaigns/${campaignId}/edit`);
};

const handleDeleteCampaign = async (campaignId: string) => {
if (!confirm('Are you sure you want to delete this campaign?')) return;

  try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
      } else {
        alert('Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Manage and schedule your social media campaigns
            </p>
          </div>
          <Button onClick={handleCreateCampaign}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {campaign.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1 capitalize">{campaign.status}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCampaign(campaign.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {campaign.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {campaign.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Platforms:</span>
                    <div className="flex gap-1">
                      {campaign.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{campaign.duration_days} days</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Posts/Day:</span>
                    <span>{campaign.posts_per_day}</span>
                  </div>
                  {campaign.topic && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Topic:</span>
                      <span>{campaign.topic}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create Campaign Card */}
          <Card className="p-6 border-dashed border-2 hover:border-primary transition-colors cursor-pointer" onClick={handleCreateCampaign}>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Campaign</h3>
              <p className="text-sm text-muted-foreground text-center">
                Set up automated posting schedules and content strategies
              </p>
            </CardContent>
          </Card>
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first campaign to start automating your social media presence
            </p>
            <Button onClick={handleCreateCampaign}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
