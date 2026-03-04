import { z } from 'zod';

// Analytics request schema
export const analyticsQuerySchema = z.object({
  platform: z.enum(['twitter', 'reddit']).optional(),
  start_date: z.string().datetime('Invalid date format').optional(),
  end_date: z.string().datetime('Invalid date format').optional(),
  metric: z.enum(['impressions', 'engagements', 'reach', 'conversion']).optional(),
  granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional().default('daily'),
});

export type AnalyticsQueryRequest = z.infer<typeof analyticsQuerySchema>;

// Performance insights schema
export const performanceInsightsSchema = z.object({
  period: z.enum(['week', 'month', 'quarter']).optional().default('week'),
  platforms: z.array(z.enum(['twitter', 'reddit'])).optional(),
  include_predictions: z.boolean().optional().default(false),
});

export type PerformanceInsightsRequest = z.infer<typeof performanceInsightsSchema>;

// Campaign analytics schema
export const campaignAnalyticsSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  breakdownBy: z.enum(['platform', 'post', 'day']).optional(),
});

export type CampaignAnalyticsRequest = z.infer<typeof campaignAnalyticsSchema>;

// Content performance schema
export const contentPerformanceSchema = z.object({
  content_type: z.enum(['text', 'image', 'video', 'thread']).optional(),
  platform: z.enum(['twitter', 'reddit']).optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  metric: z.enum(['engagement_rate', 'reach', 'impressions']).optional().default('engagement_rate'),
});

export type ContentPerformanceRequest = z.infer<typeof contentPerformanceSchema>;

// Custom report schema
export const customReportSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  metrics: z.array(z.enum(['impressions', 'engagements', 'reach', 'ctr', 'conversion'])).min(1),
  platforms: z.array(z.enum(['twitter', 'reddit'])).min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  recipients: z.array(z.string().email()).optional(),
});

export type CustomReportRequest = z.infer<typeof customReportSchema>;

// Engagement metrics schema
export const engagementMetricsSchema = z.object({
  post_id: z.string().uuid().optional(),
  campaign_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  action_type: z.enum(['like', 'comment', 'share', 'click']).optional(),
});

export type EngagementMetricsRequest = z.infer<typeof engagementMetricsSchema>;
