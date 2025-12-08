import { logger } from "../agent/utils/logger"

export interface AnalyticsEvent {
  event: string
  campaignId?: string
  agentId?: string
  channel?: string
  properties?: Record<string, any>
  timestamp?: Date
}

export interface CampaignMetrics {
  campaignId: string
  impressions: number
  engagements: number
  clicks: number
  conversions: number
  reach: number
  engagementRate: number
  clickThroughRate: number
  conversionRate: number
  costPerClick?: number
  costPerConversion?: number
  revenue?: number
  roi?: number
}

export class AnalyticsTracker {
  private events: AnalyticsEvent[] = []
  private metrics: Map<string, CampaignMetrics> = new Map()

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const eventWithTimestamp = {
        ...event,
        timestamp: event.timestamp || new Date(),
      }

      this.events.push(eventWithTimestamp)

      // Update campaign metrics if applicable
      if (event.campaignId) {
        await this.updateCampaignMetrics(event.campaignId, event)
      }

      logger.info({
        event: event.event,
        campaignId: event.campaignId,
        channel: event.channel,
      }, "Analytics event tracked")

      // In production, you would send this to your analytics service
      // await this.sendToAnalyticsService(eventWithTimestamp)
    } catch (error) {
      logger.error({ error, event }, "Failed to track analytics event")
    }
  }

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics | null> {
    try {
      let metrics = this.metrics.get(campaignId)

      if (!metrics) {
        // Initialize metrics for new campaign
        metrics = {
          campaignId,
          impressions: 0,
          engagements: 0,
          clicks: 0,
          conversions: 0,
          reach: 0,
          engagementRate: 0,
          clickThroughRate: 0,
          conversionRate: 0,
        }
        this.metrics.set(campaignId, metrics)
      }

      // Calculate derived metrics
      metrics.engagementRate = metrics.impressions > 0 ? (metrics.engagements / metrics.impressions) * 100 : 0

      metrics.clickThroughRate = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0

      metrics.conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0

      return metrics
    } catch (error) {
      logger.error({ error, campaignId }, "Failed to get campaign metrics")
      return null
    }
  }

  async getAllCampaignMetrics(): Promise<CampaignMetrics[]> {
    try {
      const allMetrics: CampaignMetrics[] = []

      for (const [campaignId, metrics] of this.metrics.entries()) {
        const updatedMetrics = await this.getCampaignMetrics(campaignId)
        if (updatedMetrics) {
          allMetrics.push(updatedMetrics)
        }
      }

      return allMetrics
    } catch (error) {
      logger.error({ error }, "Failed to get all campaign metrics")
      return []
    }
  }

  private async updateCampaignMetrics(campaignId: string, event: AnalyticsEvent): Promise<void> {
    try {
      let metrics = this.metrics.get(campaignId)

      if (!metrics) {
        metrics = {
          campaignId,
          impressions: 0,
          engagements: 0,
          clicks: 0,
          conversions: 0,
          reach: 0,
          engagementRate: 0,
          clickThroughRate: 0,
          conversionRate: 0,
        }
      }

      // Update metrics based on event type
      switch (event.event) {
        case "content_posted":
        case "impression":
          metrics.impressions += event.properties?.count || 1
          break
        case "engagement":
        case "like":
        case "comment":
        case "share":
        case "retweet":
          metrics.engagements += event.properties?.count || 1
          break
        case "click":
        case "link_click":
          metrics.clicks += event.properties?.count || 1
          break
        case "conversion":
        case "signup":
        case "purchase":
          metrics.conversions += event.properties?.count || 1
          if (event.properties?.revenue) {
            metrics.revenue = (metrics.revenue || 0) + event.properties.revenue
          }
          break
        case "reach":
          metrics.reach = Math.max(metrics.reach, event.properties?.count || 0)
          break
      }

      this.metrics.set(campaignId, metrics)
    } catch (error) {
      logger.error({ error, campaignId, event }, "Failed to update campaign metrics")
    }
  }

  async getEventHistory(campaignId?: string, limit = 100): Promise<AnalyticsEvent[]> {
    try {
      let filteredEvents = this.events

      if (campaignId) {
        filteredEvents = this.events.filter((event) => event.campaignId === campaignId)
      }

      return filteredEvents
        .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
        .slice(0, limit)
    } catch (error) {
      logger.error({ error }, "Failed to get event history")
      return []
    }
  }

  async generateReport(campaignId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const metrics = await this.getCampaignMetrics(campaignId)
      const events = await this.getEventHistory(campaignId)

      let filteredEvents = events
      if (startDate || endDate) {
        filteredEvents = events.filter((event) => {
          const eventTime = event.timestamp?.getTime() || 0
          const start = startDate?.getTime() || 0
          const end = endDate?.getTime() || Date.now()
          return eventTime >= start && eventTime <= end
        })
      }

      // Group events by channel
      const channelBreakdown = filteredEvents.reduce(
        (acc, event) => {
          if (event.channel) {
            acc[event.channel] = (acc[event.channel] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      )

      // Group events by day
      const dailyBreakdown = filteredEvents.reduce(
        (acc, event) => {
          if (event.timestamp) {
            const day = event.timestamp.toISOString().split("T")[0]
            acc[day] = (acc[day] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        campaignId,
        metrics,
        totalEvents: filteredEvents.length,
        channelBreakdown,
        dailyBreakdown,
        topEvents: filteredEvents.slice(0, 10),
        reportGeneratedAt: new Date(),
      }
    } catch (error) {
      logger.error({ error, campaignId }, "Failed to generate analytics report")
      return null
    }
  }
}

// Global analytics tracker instance
export const analyticsTracker = new AnalyticsTracker()
