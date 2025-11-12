import { supabaseServer } from '@/src/lib/supabaseServer';
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

export interface EngagementOpportunity {
  id: string;
  user_id: string;
  platform: 'twitter' | 'reddit';
  platform_post_id: string;
  content: string;
  author: string;
  relevance_score: number;
  suggested_action: 'like' | 'retweet' | 'reply' | 'follow';
  suggested_reply?: string;
  status: 'pending' | 'engaged' | 'skipped' | 'failed';
  created_at: string;
  engaged_at?: string;
  metadata?: Record<string, any>;
}

export interface EngagementStats {
  total_opportunities: number;
  engaged_count: number;
  skipped_count: number;
  failed_count: number;
  avg_relevance_score: number;
  platform_breakdown: Record<string, number>;
}

export class EngagementSuiteService {
  static async discoverEngagementOpportunities(userId: string, minScore: number = 70, limit: number = 50): Promise<EngagementOpportunity[]> {
    try {
      const composioService = new ComposioIntegrationService(userId);

      // Get user's connected platforms
      const connections = await composioService.listConnectedAccounts();
      const opportunities: EngagementOpportunity[] = [];

      for (const connection of connections) {
        if (connection.appName === 'twitter') {
          // Get recent tweets from timeline
          const tweets = await composioService.getUserTimeline(20);

          for (const tweet of tweets) {
            // Analyze tweet for engagement potential
            const analysis = await composioService.analyzeTweet(tweet.text || tweet.content || '');

            if (analysis.engagement_potential >= minScore) {
              // Determine suggested action based on content and user patterns
              const suggestedAction = await this.determineSuggestedAction(tweet, analysis, userId);

              opportunities.push({
                id: `opp_${userId}_${tweet.id}_${Date.now()}`,
                user_id: userId,
                platform: 'twitter',
                platform_post_id: tweet.id,
                content: tweet.text || tweet.content || '',
                author: tweet.author?.username || tweet.user?.screen_name || 'unknown',
                relevance_score: analysis.engagement_potential,
                suggested_action: suggestedAction.action,
                suggested_reply: suggestedAction.reply,
                status: 'pending',
                created_at: new Date().toISOString(),
                metadata: {
                  tweet_data: tweet,
                  analysis,
                },
              });
            }
          }
        }
        // Add Reddit support when implemented
      }

      // Save opportunities to database
      if (opportunities.length > 0) {
        const { error } = await supabaseServer
          .from('engagement_opportunities')
          .insert(opportunities.slice(0, limit));

        if (error) {
          console.error('Error saving engagement opportunities:', error);
        }
      }

      return opportunities.slice(0, limit);
    } catch (error) {
      console.error('Error discovering engagement opportunities:', error);
      return [];
    }
  }

  static async getPendingOpportunities(userId: string, minScore: number = 70, limit: number = 50): Promise<EngagementOpportunity[]> {
    const { data, error } = await supabaseServer
      .from('engagement_opportunities')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('relevance_score', minScore)
      .order('relevance_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async engageWithOpportunity(
    opportunityId: string,
    userId: string,
    action: 'like' | 'retweet' | 'reply' | 'skip'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the opportunity
      const { data: opportunity, error: oppError } = await supabaseServer
        .from('engagement_opportunities')
        .select('*')
        .eq('id', opportunityId)
        .eq('user_id', userId)
        .single();

      if (oppError || !opportunity) {
        return { success: false, error: 'Opportunity not found' };
      }

      if (action === 'skip') {
        await supabaseServer
          .from('engagement_opportunities')
          .update({ status: 'skipped', engaged_at: new Date().toISOString() })
          .eq('id', opportunityId);
        return { success: true };
      }

      // Perform the engagement
      const composioService = new ComposioIntegrationService(userId);
      const result = await composioService.autoEngageWithTweet(
        opportunity.platform_post_id,
        action as 'like' | 'retweet' | 'reply',
        action === 'reply' ? opportunity.suggested_reply : undefined
      );

      // Update opportunity status
      await supabaseServer
        .from('engagement_opportunities')
        .update({
          status: result.success ? 'engaged' : 'failed',
          engaged_at: new Date().toISOString(),
          metadata: {
            ...opportunity.metadata,
            engagement_result: result,
          },
        })
        .eq('id', opportunityId);

      return result;
    } catch (error) {
      console.error('Error engaging with opportunity:', error);
      return { success: false, error: 'Failed to engage' };
    }
  }

  static async getEngagementStats(userId: string): Promise<EngagementStats> {
    const { data, error } = await supabaseServer
      .from('engagement_opportunities')
      .select('status, platform, relevance_score')
      .eq('user_id', userId);

    if (error) throw error;

    const stats: EngagementStats = {
      total_opportunities: data?.length || 0,
      engaged_count: 0,
      skipped_count: 0,
      failed_count: 0,
      avg_relevance_score: 0,
      platform_breakdown: {},
    };

    let totalScore = 0;

    data?.forEach(opp => {
      switch (opp.status) {
        case 'engaged':
          stats.engaged_count++;
          break;
        case 'skipped':
          stats.skipped_count++;
          break;
        case 'failed':
          stats.failed_count++;
          break;
      }

      totalScore += opp.relevance_score || 0;

      stats.platform_breakdown[opp.platform] = (stats.platform_breakdown[opp.platform] || 0) + 1;
    });

    stats.avg_relevance_score = stats.total_opportunities > 0 ? totalScore / stats.total_opportunities : 0;

    return stats;
  }

  private static async determineSuggestedAction(
    tweet: any,
    analysis: any,
    userId: string
  ): Promise<{ action: 'like' | 'retweet' | 'reply' | 'follow'; reply?: string }> {
    // Simple logic - can be enhanced with ML
    const engagementPotential = analysis.engagement_potential;

    if (engagementPotential >= 85) {
      // High engagement potential - suggest reply
      const reply = await this.generateReply(tweet, analysis, userId);
      return { action: 'reply', reply };
    } else if (engagementPotential >= 75) {
      return { action: 'retweet' };
    } else {
      return { action: 'like' };
    }
  }

  private static async generateReply(tweet: any, analysis: any, userId: string): Promise<string> {
    try {
      const composioService = new ComposioIntegrationService(userId);
      const patterns = await composioService.getUserPatterns();

      // Generate contextual reply based on user's style
      const prompt = `Generate a reply to this tweet in the user's authentic voice:

Tweet: "${tweet.text || tweet.content}"
Tweet analysis: ${JSON.stringify(analysis)}

User's voice characteristics: ${patterns.voice_characteristics || 'engaging and professional'}
Common reply style: ${patterns.common_hooks?.[0] || 'helpful and conversational'}

Generate a short, natural reply (max 280 chars) that would fit the user's posting style.`;

      const response = await fetch('/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'twitter',
          topic: `Reply to: ${analysis.topics?.[0] || 'general discussion'}`,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.post || 'Interesting! Thanks for sharing. 🙌';
      }
    } catch (error) {
      console.error('Error generating reply:', error);
    }

    return 'Great insight! Thanks for sharing. 👍';
  }
}
