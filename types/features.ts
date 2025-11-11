// Type definitions for 5 new features

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';
export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'cancelled';
export type EngagementAction = 'like' | 'retweet' | 'reply' | 'quote' | 'upvote' | 'comment';
export type PlatformType = 'twitter' | 'reddit';

// =====================================================
// 1. APPROVAL WORKFLOW TYPES
// =====================================================

export interface PostApproval {
  id: string;
  post_id: string;
  user_id: string;
  status: ApprovalStatus;
  original_content: string;
  edited_content?: string;
  feedback?: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningFeedback {
  id: string;
  user_id: string;
  post_id?: string;
  original_content: string;
  edited_content: string;
  edit_type: 'tone' | 'length' | 'format' | 'content' | 'other';
  metadata: Record<string, any>;
  created_at: string;
}

export interface ApprovalQueueItem extends PostApproval {
  post: {
    platform: PlatformType;
    scheduled_at?: string;
    campaign_id?: string;
  };
}

// =====================================================
// 2. CONTENT PERFORMANCE INTELLIGENCE TYPES
// =====================================================

export interface PerformanceInsight {
  id: string;
  user_id: string;
  insight_type: 'best_time' | 'best_format' | 'trending_topic' | 'competitor_benchmark';
  title: string;
  description: string;
  data: Record<string, any>;
  confidence_score: number; // 0.0 to 1.0
  action_recommendation?: string;
  created_at: string;
  expires_at?: string;
}

export interface ContentPerformanceMetrics {
  id: string;
  user_id: string;
  period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  platform: PlatformType;
  total_posts: number;
  total_impressions: number;
  total_engagements: number;
  avg_engagement_rate: number;
  top_performing_content_type?: string;
  best_posting_hour?: number;
  metrics: Record<string, any>;
  created_at: string;
}

export interface PerformanceDashboardData {
  insights: PerformanceInsight[];
  weeklyMetrics: ContentPerformanceMetrics[];
  bestPostingTimes: { hour: number; engagement_rate: number }[];
  contentTypePerformance: { type: string; avg_engagement: number; count: number }[];
  trendsData: { date: string; impressions: number; engagements: number }[];
}

// =====================================================
// 3. CONTENT REPURPOSING ENGINE TYPES
// =====================================================

export interface ContentSource {
  id: string;
  user_id: string;
  source_type: 'blog' | 'article' | 'youtube' | 'podcast' | 'document';
  source_url?: string;
  title: string;
  raw_content: string;
  extracted_points: string[];
  metadata: Record<string, any>;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepurposedContent {
  id: string;
  source_id: string;
  post_id?: string;
  user_id: string;
  angle: 'tip' | 'question' | 'statistic' | 'quote' | 'how-to' | 'thread';
  generated_content: string;
  used: boolean;
  created_at: string;
}

export interface RepurposingResult {
  source: ContentSource;
  generated_posts: RepurposedContent[];
  total_posts: number;
}

// =====================================================
// 4. COMMUNITY ENGAGEMENT SUITE TYPES
// =====================================================

export interface EngagementOpportunity {
  id: string;
  user_id: string;
  platform: PlatformType;
  opportunity_type: 'mention' | 'keyword_match' | 'trending_topic' | 'competitor_post';
  platform_post_id: string;
  platform_post_url?: string;
  author_username?: string;
  content: string;
  relevance_score: number; // 0-100
  suggested_response?: string;
  engaged: boolean;
  engaged_at?: string;
  engagement_type?: EngagementAction;
  metadata: Record<string, any>;
  expires_at: string;
  created_at: string;
}

export interface EngagementTracking {
  id: string;
  user_id: string;
  opportunity_id?: string;
  platform: PlatformType;
  action: EngagementAction;
  platform_post_id: string;
  response_content?: string;
  success: boolean;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EngagementStats {
  total_opportunities: number;
  engaged_count: number;
  pending_count: number;
  avg_relevance_score: number;
  engagement_by_type: Record<EngagementAction, number>;
}

// =====================================================
// 5. GROWTH EXPERIMENTS FRAMEWORK TYPES
// =====================================================

export interface ExperimentVariant {
  index: number;
  name: string;
  config: Record<string, any>;
}

export interface Experiment {
  id: string;
  user_id: string;
  campaign_id?: string;
  name: string;
  description?: string;
  hypothesis: string;
  experiment_type: 'time' | 'content_format' | 'cta' | 'emoji' | 'length' | 'hook';
  status: ExperimentStatus;
  control_variant: ExperimentVariant;
  test_variants: ExperimentVariant[];
  sample_size_per_variant: number;
  confidence_level: number;
  winner_variant_index?: number;
  statistical_significance?: number;
  results_summary: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentVariantStats {
  id: string;
  experiment_id: string;
  variant_index: number;
  variant_name: string;
  variant_config: Record<string, any>;
  posts_count: number;
  total_impressions: number;
  total_engagements: number;
  avg_engagement_rate: number;
  performance_metrics: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ExperimentResults {
  experiment: Experiment;
  variants: ExperimentVariantStats[];
  winner?: ExperimentVariantStats;
  statistical_significance: number;
  recommendation: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

// Approval workflow API types
export interface ApprovePostRequest {
  post_id: string;
  status: 'approved' | 'rejected';
  edited_content?: string;
  feedback?: string;
}

export interface ApprovalQueueResponse {
  pending: ApprovalQueueItem[];
  total: number;
}

// Content repurposing API types
export interface RepurposeContentRequest {
  source_type: ContentSource['source_type'];
  source_url?: string;
  title: string;
  content: string;
  num_posts?: number;
}

export interface RepurposeContentResponse {
  source_id: string;
  generated_posts: RepurposedContent[];
  message: string;
}

// Engagement suite API types
export interface FindEngagementOpportunitiesRequest {
  platform: PlatformType;
  keywords?: string[];
  min_relevance_score?: number;
  limit?: number;
}

export interface EngageWithOpportunityRequest {
  opportunity_id: string;
  action: EngagementAction;
  response_content?: string;
}

// Experiments API types
export interface CreateExperimentRequest {
  name: string;
  description?: string;
  hypothesis: string;
  experiment_type: Experiment['experiment_type'];
  campaign_id?: string;
  control_variant: ExperimentVariant;
  test_variants: ExperimentVariant[];
  sample_size_per_variant?: number;
}

export interface StartExperimentRequest {
  experiment_id: string;
}

export interface ExperimentResultsResponse {
  experiment: Experiment;
  variants: ExperimentVariantStats[];
  winner?: {
    variant: ExperimentVariantStats;
    improvement_percentage: number;
  };
  statistical_significance: number;
  is_conclusive: boolean;
  recommendation: string;
}

// Performance intelligence API types
export interface GenerateInsightsRequest {
  period?: 'week' | 'month' | 'quarter';
  platforms?: PlatformType[];
}

export interface PerformanceInsightsResponse {
  insights: PerformanceInsight[];
  metrics: ContentPerformanceMetrics[];
  summary: {
    total_posts: number;
    avg_engagement_rate: number;
    best_platform: PlatformType;
    growth_percentage: number;
  };
}
