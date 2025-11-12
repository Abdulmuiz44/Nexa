import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { EngagementOpportunity, EngagementTracking, EngagementStats } from '@/types/features';

let cachedSupabase: SupabaseClient | null | undefined = undefined;

function ensureSupabase(): SupabaseClient {
  if (cachedSupabase !== undefined) {
    if (!cachedSupabase) {
      throw new Error('Supabase configuration missing for EngagementSuiteService.');
    }
    return cachedSupabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    cachedSupabase = null;
    throw new Error('Supabase configuration missing for EngagementSuiteService.');
  }

  cachedSupabase = createClient(supabaseUrl, supabaseKey);
  return cachedSupabase;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export class EngagementSuiteService {
  /**
   * Find engagement opportunities for a user
   */
  static async findOpportunities(
    userId: string,
    platform: 'twitter' | 'reddit',
    keywords?: string[],
    limit: number = 20
  ): Promise<EngagementOpportunity[]> {
    const supabase = ensureSupabase();
    // Get user's niche and topics from onboarding data
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_data')
      .eq('id', userId)
      .single();

    const userKeywords = keywords || user?.onboarding_data?.content_topics || [];
    const opportunities: EngagementOpportunity[] = [];

    // In production, this would call Twitter/Reddit APIs via Composio
    // For now, we'll simulate finding opportunities
    
    // Fetch from real platforms would go here
    // Example: const tweets = await composio.searchTweets({ keywords, limit });

    return opportunities;
  }

  /**
   * Calculate relevance score for content
   */
  static async calculateRelevanceScore(
    userId: string,
    content: string,
    authorUsername: string
  ): Promise<number> {
    try {
      const supabase = ensureSupabase();
      const { data: user } = await supabase
        .from('users')
        .select('onboarding_data')
        .eq('id', userId)
        .single();

      const userNiche = user?.onboarding_data?.niche || '';
      const userTopics = user?.onboarding_data?.content_topics || [];

      // Use AI to score relevance
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a relevance scoring AI. Score how relevant a post is to a user's interests on a scale of 0-100. Consider topic match, engagement potential, and authenticity.`
          },
          {
            role: 'user',
            content: `User's niche: ${userNiche}\nUser's topics: ${userTopics.join(', ')}\n\nPost content: ${content}\nAuthor: ${authorUsername}\n\nProvide only a relevance score (0-100):`
          }
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const scoreText = response.choices[0]?.message?.content?.trim() || '0';
      const score = parseInt(scoreText.match(/\d+/)?.[0] || '0');
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Error calculating relevance:', error);
      // Fallback: simple keyword matching
      return this.simpleRelevanceScore(content, userId);
    }
  }

  /**
   * Simple keyword-based relevance scoring (fallback)
   */
  private static async simpleRelevanceScore(content: string, userId: string): Promise<number> {
    const supabase = ensureSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_data')
      .eq('id', userId)
      .single();

    const topics = user?.onboarding_data?.content_topics || [];
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    topics.forEach((topic: string) => {
      if (contentLower.includes(topic.toLowerCase())) {
        matches++;
      }
    });

    return Math.min(100, (matches / Math.max(topics.length, 1)) * 100);
  }

  /**
   * Generate suggested response for an opportunity
   */
  static async generateResponse(
    opportunity: EngagementOpportunity,
    userId: string
  ): Promise<string> {
    try {
      const supabase = ensureSupabase();
      const { data: user } = await supabase
        .from('users')
        .select('onboarding_data')
        .eq('id', userId)
        .single();

      const userInfo = user?.onboarding_data || {};

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are helping create an authentic, valuable response to a social media post. Be helpful, genuine, and concise. Keep responses under 280 characters.`
          },
          {
            role: 'user',
            content: `Original post: ${opportunity.content}\n\nContext: ${userInfo.niche || 'general'}\n\nGenerate a helpful, engaging reply:`
          }
        ],
        temperature: 0.8,
        max_tokens: 100,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('Error generating response:', error);
      return '';
    }
  }

  /**
   * Save engagement opportunity
   */
  static async saveOpportunity(
    opportunity: Omit<EngagementOpportunity, 'id' | 'created_at'>
  ): Promise<EngagementOpportunity> {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('engagement_opportunities')
      .insert(opportunity)
      .select()
      .single();

    if (error) throw new Error(`Failed to save opportunity: ${error.message}`);
    return data as EngagementOpportunity;
  }

  /**
   * Get pending engagement opportunities
   */
  static async getPendingOpportunities(
    userId: string,
    minScore: number = 70,
    limit: number = 50
  ): Promise<EngagementOpportunity[]> {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('engagement_opportunities')
      .select('*')
      .eq('user_id', userId)
      .eq('engaged', false)
      .gte('relevance_score', minScore)
      .gt('expires_at', new Date().toISOString())
      .order('relevance_score', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch opportunities: ${error.message}`);
    return data as EngagementOpportunity[];
  }

  /**
   * Engage with an opportunity
   */
  static async engageWithOpportunity(
    opportunityId: string,
    action: 'like' | 'retweet' | 'reply' | 'quote' | 'upvote' | 'comment',
    responseContent?: string
  ): Promise<EngagementTracking> {
    const supabase = ensureSupabase();
    // Get the opportunity
    const { data: opportunity } = await supabase
      .from('engagement_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) throw new Error('Opportunity not found');

    // In production, actually perform the engagement via Composio/platform APIs
    // For now, we'll track it
    let success = true;
    let errorMessage = '';

    try {
      // This would be: await composio.likePost(opportunity.platform_post_id);
      // Or: await composio.replyToPost(opportunity.platform_post_id, responseContent);
    } catch (error) {
      success = false;
      errorMessage = (error as Error).message;
    }

    // Track the engagement
    const { data: tracking, error: trackError } = await supabase
      .from('engagement_tracking')
      .insert({
        user_id: opportunity.user_id,
        opportunity_id: opportunityId,
        platform: opportunity.platform,
        action: action,
        platform_post_id: opportunity.platform_post_id,
        response_content: responseContent,
        success: success,
        error_message: errorMessage,
        metadata: {}
      })
      .select()
      .single();

    if (trackError) throw new Error(`Failed to track engagement: ${trackError.message}`);

    // Mark opportunity as engaged
    if (success) {
      await supabase
        .from('engagement_opportunities')
        .update({
          engaged: true,
          engaged_at: new Date().toISOString(),
          engagement_type: action
        })
        .eq('id', opportunityId);
    }

    return tracking as EngagementTracking;
  }

  /**
   * Get engagement statistics
   */
  static async getEngagementStats(userId: string): Promise<EngagementStats> {
    const supabase = ensureSupabase();
    const { data: opportunities } = await supabase
      .from('engagement_opportunities')
      .select('engaged, relevance_score')
      .eq('user_id', userId);

    const { data: tracking } = await supabase
      .from('engagement_tracking')
      .select('action')
      .eq('user_id', userId);

    const total = opportunities?.length || 0;
    const engaged = opportunities?.filter(o => o.engaged).length || 0;
    const pending = total - engaged;
    const avgScore = opportunities?.reduce((sum, o) => sum + o.relevance_score, 0) / total || 0;

    const engagementByType: Record<string, number> = {};
    tracking?.forEach(t => {
      engagementByType[t.action] = (engagementByType[t.action] || 0) + 1;
    });

    return {
      total_opportunities: total,
      engaged_count: engaged,
      pending_count: pending,
      avg_relevance_score: avgScore,
      engagement_by_type: engagementByType as Record<'like' | 'retweet' | 'reply' | 'quote' | 'upvote' | 'comment', number>
    };
  }

  /**
   * Auto-engage based on rules
   */
  static async autoEngage(userId: string): Promise<number> {
    const supabase = ensureSupabase();
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_data')
      .eq('id', userId)
      .single();

    const autoEngageEnabled = user?.onboarding_data?.auto_engage_enabled || false;
    const minScore = user?.onboarding_data?.min_engagement_score || 80;
    const autoLike = user?.onboarding_data?.auto_like || false;
    const autoReply = user?.onboarding_data?.auto_reply || false;

    if (!autoEngageEnabled) return 0;

    // Get high-scoring opportunities
    const opportunities = await this.getPendingOpportunities(userId, minScore, 10);

    let engagedCount = 0;

    for (const opp of opportunities) {
      try {
        if (autoLike && opp.opportunity_type !== 'mention') {
          await this.engageWithOpportunity(opp.id, 'like');
          engagedCount++;
        }

        if (autoReply && opp.suggested_response) {
          await this.engageWithOpportunity(opp.id, 'reply', opp.suggested_response);
          engagedCount++;
        }

        // Rate limiting: wait 5 seconds between engagements
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error auto-engaging with opportunity ${opp.id}:`, error);
      }
    }

    return engagedCount;
  }

  /**
   * Clean up expired opportunities
   */
  static async cleanupExpired(): Promise<number> {
    const supabase = ensureSupabase();
    const { data } = await supabase
      .from('engagement_opportunities')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    return data?.length || 0;
  }
}
