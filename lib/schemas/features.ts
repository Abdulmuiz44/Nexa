import { z } from 'zod';

// =====================================================
// APPROVAL WORKFLOW SCHEMAS
// =====================================================

export const approvePostSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be approved or rejected' })
  }),
  edited_content: z.string().max(5000).optional(),
  feedback: z.string().max(1000).optional(),
});

export type ApprovePostRequest = z.infer<typeof approvePostSchema>;

export const learningFeedbackSchema = z.object({
  post_id: z.string().uuid().optional(),
  original_content: z.string().min(1).max(5000),
  edited_content: z.string().min(1).max(5000),
  edit_type: z.enum(['tone', 'length', 'format', 'content', 'other']),
  metadata: z.record(z.unknown()).optional(),
});

export type LearningFeedbackRequest = z.infer<typeof learningFeedbackSchema>;

// =====================================================
// CONTENT REPURPOSING SCHEMAS
// =====================================================

export const repurposeContentSchema = z.object({
  source_type: z.enum(['blog', 'article', 'youtube', 'podcast', 'document']),
  source_url: z.string().url('Invalid URL').optional(),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(10000),
  num_posts: z.number().int().positive().max(20).optional().default(5),
  angles: z.array(z.enum(['tip', 'question', 'statistic', 'quote', 'how-to', 'thread'])).optional(),
});

export type RepurposeContentRequest = z.infer<typeof repurposeContentSchema>;

// =====================================================
// COMMUNITY ENGAGEMENT SCHEMAS
// =====================================================

export const findEngagementOpportunitiesSchema = z.object({
  platform: z.enum(['twitter', 'reddit']),
  keywords: z.array(z.string()).max(10).optional(),
  min_relevance_score: z.number().min(0).max(100).optional().default(50),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type FindEngagementOpportunitiesRequest = z.infer<typeof findEngagementOpportunitiesSchema>;

export const engageWithOpportunitySchema = z.object({
  opportunity_id: z.string().uuid('Invalid opportunity ID'),
  action: z.enum(['like', 'retweet', 'reply', 'quote', 'upvote', 'comment']),
  response_content: z.string().max(5000).optional(),
});

export type EngageWithOpportunityRequest = z.infer<typeof engageWithOpportunitySchema>;

// =====================================================
// EXPERIMENTS SCHEMAS
// =====================================================

export const experimentVariantSchema = z.object({
  name: z.string().min(1).max(100),
  config: z.record(z.unknown()),
});

export const createExperimentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  hypothesis: z.string().min(10).max(2000),
  experiment_type: z.enum(['time', 'content_format', 'cta', 'emoji', 'length', 'hook']),
  campaign_id: z.string().uuid().optional(),
  control_variant: experimentVariantSchema,
  test_variants: z.array(experimentVariantSchema).min(1).max(5),
  sample_size_per_variant: z.number().int().positive().optional().default(30),
  confidence_level: z.number().min(0.8).max(0.99).optional().default(0.95),
});

export type CreateExperimentRequest = z.infer<typeof createExperimentSchema>;

export const startExperimentSchema = z.object({
  experiment_id: z.string().uuid('Invalid experiment ID'),
});

export type StartExperimentRequest = z.infer<typeof startExperimentSchema>;

export const endExperimentSchema = z.object({
  experiment_id: z.string().uuid('Invalid experiment ID'),
  reason: z.string().optional(),
});

export type EndExperimentRequest = z.infer<typeof endExperimentSchema>;

// =====================================================
// SHARED PAGINATION SCHEMA
// =====================================================

export const paginationSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type PaginationRequest = z.infer<typeof paginationSchema>;
