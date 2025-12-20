/**
 * Composio Integration Type Definitions
 */

export type SocialMediaPlatform = 'twitter' | 'reddit' | 'linkedin';

export interface ComposioConnection {
  id: string;
  user_id: string;
  composio_connection_id: string;
  toolkit_slug: SocialMediaPlatform;
  account_username: string;
  account_id: string;
  status: 'active' | 'inactive' | 'revoked';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ComposioAuthSession {
  authUrl: string;
  connectionId: string;
  state?: string;
}

export interface SocialMediaPost {
  id: string;
  user_id: string;
  platform: SocialMediaPlatform;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platform_post_id?: string;
  published_at?: string;
  scheduled_at?: string;
  url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PostAnalytics {
  platform: SocialMediaPlatform;
  postId: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  retweets?: number;
  engagement_rate: number;
  fetched_at: string;
}

export interface UserConnectionStats {
  total_connections: number;
  twitter_connections: number;
  reddit_connections: number;
  linkedin_connections: number;
  total_posts: number;
  published_posts: number;
  scheduled_posts: number;
  draft_posts: number;
}

export interface ComposioToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface AutoPostConfig {
  enabled: boolean;
  platforms: SocialMediaPlatform[];
  frequency: 'hourly' | 'daily' | 'weekly';
  schedule?: {
    time?: string; // HH:mm format
    daysOfWeek?: number[]; // 0-6
  };
  maxPostsPerDay?: number;
  contentTopics?: string[];
}

export interface AutoEngageConfig {
  enabled: boolean;
  platforms: SocialMediaPlatform[];
  engageWith?: {
    likes: boolean;
    retweets: boolean;
    replies: boolean;
  };
  minEngagementScore?: number; // 0-100
  keywords?: string[];
  excludeKeywords?: string[];
}

export interface AgentConfig {
  autoPost?: AutoPostConfig;
  autoEngage?: AutoEngageConfig;
  contentTone?: 'professional' | 'casual' | 'humorous';
  targetAudience?: string;
  contentThemes?: string[];
  tweetPatterns?: {
    common_hooks: string[];
    typical_structure: string;
    voice_characteristics: string;
    engagement_patterns: {
      best_time: string;
      best_day: string;
      avg_engagement: number;
    };
    content_themes: string[];
  };
}

export interface UserCredits {
  current_balance: number;
  credits_used: number;
  credits_earned: number;
  last_reset?: string;
  tier: 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';
}

export interface ComposioError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export interface AuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface PlatformAuthConfig {
  platform: SocialMediaPlatform;
  authConfigId?: string;
  scopes?: string[];
  redirectUrl: string;
}
