import { z } from 'zod';

// Create post schema
export const createPostSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  campaign_id: z.string().uuid('Invalid campaign ID').optional(),
  platform: z.enum(['twitter', 'reddit'], {
    errorMap: () => ({ message: 'Platform must be twitter or reddit' })
  }),
  scheduled_at: z.string().datetime('Invalid date format').optional(),
  media_urls: z.array(z.string().url('Invalid media URL')).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreatePostRequest = z.infer<typeof createPostSchema>;

// Update post schema
export const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdatePostRequest = z.infer<typeof updatePostSchema>;

// Post publish schema
export const publishPostSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  platform: z.enum(['twitter', 'reddit']),
});

export type PublishPostRequest = z.infer<typeof publishPostSchema>;

// Post analytics schema
export const postAnalyticsSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export type PostAnalyticsRequest = z.infer<typeof postAnalyticsSchema>;

// Batch post creation schema
export const batchCreatePostsSchema = z.object({
  posts: z.array(createPostSchema).min(1, 'At least one post is required').max(50, 'Maximum 50 posts per batch'),
  campaign_id: z.string().uuid().optional(),
});

export type BatchCreatePostsRequest = z.infer<typeof batchCreatePostsSchema>;

// Post filter schema
export const postFilterSchema = z.object({
  campaign_id: z.string().uuid().optional(),
  platform: z.enum(['twitter', 'reddit']).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  sort_by: z.enum(['created_at', 'scheduled_at', 'engagement_rate']).optional().default('created_at'),
});

export type PostFilterRequest = z.infer<typeof postFilterSchema>;
