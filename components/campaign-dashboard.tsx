"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Square, BarChart3, Users, MessageSquare, TrendingUp } from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: "running" | "paused" | "completed" | "draft"
  progress: number
  channels: string[]
  metrics: {
    impressions: number
    engagements: number
    clicks: number
    conversions: number
  }
  budget: {
    total: number
    spent: number
  }
  createdAt: string
}

interface CampaignDashboardProps {
  campaigns: Campaign[]
  onCampaignAction: (campaignId: string, action: "start" | "pause" | "stop") => void
}

export function CampaignDashboard({ campaigns, onCampaignAction }: CampaignDashboardProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "running":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "completed":
        return "bg-blue-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4" />
      case "paused":
        return <Pause className="h-4 w-4" />
      case "completed":
        return <Square className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  const totalMetrics = campaigns.reduce(
    (acc, campaign) => ({
      impressions: acc.impressions + campaign.metrics.impressions,
      engagements: acc.engagements + campaign.metrics.engagements,
      clicks: acc.clicks + campaign.metrics.clicks,
      conversions: acc.conversions + campaign.metrics.conversions,
    }),
    { impressions: 0, engagements: 0, clicks: 0, conversions: 0 },
  )

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.impressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.engagements.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.clicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.conversions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(campaign.status)}`} />
                  <div>
                    <h3 className="font-medium">{campaign.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Progress: {campaign.progress}%</span>
                      <span>•</span>
                      <span>
                        Budget: ${campaign.budget.spent}/${campaign.budget.total}
                      </span>
                    </div>
                    <div className="flex space-x-1 mt-1">
                      {campaign.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={campaign.progress} className="w-20" />
                  <div className="flex space-x-1">
                    {campaign.status === "running" ? (
                      <Button size="sm" variant="outline" onClick={() => onCampaignAction(campaign.id, "pause")}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => onCampaignAction(campaign.id, "start")}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onCampaignAction(campaign.id, "stop")}>
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
