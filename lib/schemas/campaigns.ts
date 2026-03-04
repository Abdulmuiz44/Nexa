import { z } from 'zod';

// Create campaign schema
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  objective: z.enum(['awareness', 'engagement', 'traffic', 'leads', 'conversions'], {
    errorMap: () => ({ message: 'Invalid campaign objective' })
  }),
  platforms: z.array(z.enum(['twitter', 'reddit']), {
    errorMap: () => ({ message: 'Invalid platform selection' })
  }).min(1, 'At least one platform is required'),
  budget: z.number().positive('Budget must be greater than 0').optional(),
  start_date: z.string().datetime('Invalid start date format').optional(),
  end_date: z.string().datetime('Invalid end date format').optional(),
});

export type CreateCampaignRequest = z.infer<typeof createCampaignSchema>;

// Update campaign schema
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  objective: z.enum(['awareness', 'engagement', 'traffic', 'leads', 'conversions']).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  budget: z.number().positive().optional(),
  end_date: z.string().datetime().optional(),
});

export type UpdateCampaignRequest = z.infer<typeof updateCampaignSchema>;

// Campaign filter schema
export const campaignFilterSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  objective: z.enum(['awareness', 'engagement', 'traffic', 'leads', 'conversions']).optional(),
  platform: z.enum(['twitter', 'reddit']).optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type CampaignFilterRequest = z.infer<typeof campaignFilterSchema>;

// Campaign pause/resume schema
export const pauseResumeCampaignSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID'),
  reason: z.string().optional(),
});

export type PauseResumeCampaignRequest = z.infer<typeof pauseResumeCampaignSchema>;
