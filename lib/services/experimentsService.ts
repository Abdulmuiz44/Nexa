import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Experiment, ExperimentVariantStats, ExperimentResults } from '@/types/features';

let cachedSupabase: SupabaseClient | null | undefined = undefined;

function getSupabaseClient(): SupabaseClient {
  if (cachedSupabase !== undefined) {
    if (!cachedSupabase) {
      throw new Error('Supabase configuration missing for ExperimentsService.');
    }
    return cachedSupabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    cachedSupabase = null;
    throw new Error('Supabase configuration missing for ExperimentsService.');
  }

  cachedSupabase = createClient(supabaseUrl, supabaseKey);
  return cachedSupabase;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export class ExperimentsService {
  /**
   * Create a new experiment
   */
  static async createExperiment(experimentData: Omit<Experiment, 'id' | 'created_at' | 'updated_at'>): Promise<Experiment> {
    const { data, error } = await supabase
      .from('experiments')
      .insert(experimentData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create experiment: ${error.message}`);

    // Create variant tracking records
    const allVariants = [experimentData.control_variant, ...experimentData.test_variants];
    
    for (const variant of allVariants) {
      await supabase.from('experiment_variants').insert({
        experiment_id: data.id,
        variant_index: variant.index,
        variant_name: variant.name,
        variant_config: variant.config,
        posts_count: 0,
        total_impressions: 0,
        total_engagements: 0,
        avg_engagement_rate: 0,
        performance_metrics: {}
      });
    }

    return data as Experiment;
  }

  /**
   * Generate experiment variants automatically
   */
  static async generateVariants(
    experimentType: Experiment['experiment_type'],
    controlConfig: any,
    numVariants: number = 2
  ): Promise<any[]> {
    const variants: any[] = [];

    switch (experimentType) {
      case 'time':
        // Generate different posting times
        const basHour = controlConfig.hour || 9;
        variants.push(
          { hour: (baseHour + 3) % 24, timezone: controlConfig.timezone },
          { hour: (baseHour + 6) % 24, timezone: controlConfig.timezone }
        );
        break;

      case 'emoji':
        // Test with/without emojis
        variants.push(
          { use_emojis: true, emoji_count: 2 },
          { use_emojis: false, emoji_count: 0 }
        );
        break;

      case 'length':
        // Test different content lengths
        variants.push(
          { max_length: 140 },
          { max_length: 280 }
        );
        break;

      case 'cta':
        // Test different CTAs
        const ctas = ['Check it out!', 'Learn more:', 'What do you think?', 'Thread 👇'];
        variants.push(...ctas.slice(0, numVariants).map(cta => ({ cta_text: cta })));
        break;

      case 'hook':
        // Generate different hooks using AI
        const hooks = await this.generateHookVariants(controlConfig.topic, numVariants);
        variants.push(...hooks.map(hook => ({ hook_text: hook })));
        break;

      case 'content_format':
        // Test different formats
        variants.push(
          { format: 'question' },
          { format: 'statistic' },
          { format: 'how-to' }
        );
        break;
    }

    return variants.slice(0, numVariants);
  }

  /**
   * Generate hook variants using AI
   */
  private static async generateHookVariants(topic: string, count: number): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate engaging hook phrases for social media posts. Each hook should be attention-grabbing and under 40 characters.'
          },
          {
            role: 'user',
            content: `Topic: ${topic}\n\nGenerate ${count} different hook variations. List them one per line.`
          }
        ],
        temperature: 0.9,
        max_tokens: 200,
      });

      const hooks = response.choices[0]?.message?.content?.split('\n')
        .map(h => h.trim().replace(/^[-•*\d.)\]]\s*/, ''))
        .filter(h => h.length > 0) || [];

      return hooks.slice(0, count);
    } catch (error) {
      console.error('Error generating hooks:', error);
      return [`Here's the thing:`, `Hot take:`, `Real talk:

`];
    }
  }

  /**
   * Start an experiment
   */
  static async startExperiment(experimentId: string): Promise<Experiment> {
    const { data, error } = await supabase
      .from('experiments')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', experimentId)
      .select()
      .single();

    if (error) throw new Error(`Failed to start experiment: ${error.message}`);
    return data as Experiment;
  }

  /**
   * Record post performance for a variant
   */
  static async recordVariantPerformance(
    experimentId: string,
    variantIndex: number,
    postId: string,
    impressions: number,
    engagements: number
  ): Promise<void> {
    const engagementRate = impressions > 0 ? engagements / impressions : 0;

    // Get current variant stats
    const { data: variant } = await supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant_index', variantIndex)
      .single();

    if (!variant) return;

    // Update variant stats
    const newPostsCount = variant.posts_count + 1;
    const newTotalImpressions = variant.total_impressions + impressions;
    const newTotalEngagements = variant.total_engagements + engagements;
    const newAvgEngagementRate = newTotalImpressions > 0 
      ? newTotalEngagements / newTotalImpressions 
      : 0;

    await supabase
      .from('experiment_variants')
      .update({
        posts_count: newPostsCount,
        total_impressions: newTotalImpressions,
        total_engagements: newTotalEngagements,
        avg_engagement_rate: newAvgEngagementRate,
        performance_metrics: {
          ...variant.performance_metrics,
          [`post_${postId}`]: { impressions, engagements, engagement_rate: engagementRate }
        }
      })
      .eq('id', variant.id);
  }

  /**
   * Calculate statistical significance using two-proportion z-test
   */
  private static calculateSignificance(
    controlEngagements: number,
    controlImpressions: number,
    testEngagements: number,
    testImpressions: number
  ): number {
    if (controlImpressions === 0 || testImpressions === 0) return 0;

    const p1 = controlEngagements / controlImpressions;
    const p2 = testEngagements / testImpressions;
    const pPooled = (controlEngagements + testEngagements) / (controlImpressions + testImpressions);

    const se = Math.sqrt(pPooled * (1 - pPooled) * ((1 / controlImpressions) + (1 / testImpressions)));
    
    if (se === 0) return 0;

    const zScore = Math.abs(p1 - p2) / se;

    // Convert z-score to confidence level (approximate)
    // z > 1.96 = 95% confidence, z > 2.58 = 99% confidence
    if (zScore > 2.58) return 0.99;
    if (zScore > 1.96) return 0.95;
    if (zScore > 1.65) return 0.90;
    if (zScore > 1.28) return 0.80;
    
    return Math.min(0.75, zScore / 2.58);
  }

  /**
   * Analyze experiment results
   */
  static async analyzeExperiment(experimentId: string): Promise<ExperimentResults> {
    const { data: experiment } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (!experiment) throw new Error('Experiment not found');

    const { data: variants } = await supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('variant_index', { ascending: true });

    if (!variants || variants.length === 0) throw new Error('No variant data found');

    // Find control (index 0) and best performing variant
    const control = variants[0];
    const testVariants = variants.slice(1);
    
    const winner = variants.reduce((best, current) => 
      current.avg_engagement_rate > best.avg_engagement_rate ? current : best
    , variants[0]);

    // Calculate statistical significance
    const significance = this.calculateSignificance(
      control.total_engagements,
      control.total_impressions,
      winner.total_engagements,
      winner.total_impressions
    );

    const improvement = control.avg_engagement_rate > 0
      ? ((winner.avg_engagement_rate - control.avg_engagement_rate) / control.avg_engagement_rate) * 100
      : 0;

    // Determine if result is conclusive
    const isConclusive = winner.posts_count >= experiment.sample_size_per_variant && significance >= experiment.confidence_level;

    // Generate recommendation
    let recommendation = '';
    if (isConclusive && winner.variant_index !== 0) {
      recommendation = `Variant "${winner.variant_name}" is the clear winner with ${improvement.toFixed(1)}% better engagement. Implement this change across all posts.`;
    } else if (isConclusive && winner.variant_index === 0) {
      recommendation = `The control variant performs best. Continue with your current approach.`;
    } else {
      recommendation = `Experiment needs more data. Target: ${experiment.sample_size_per_variant} posts per variant. Current: ${winner.posts_count}`;
    }

    // Update experiment if complete
    if (isConclusive && experiment.status === 'running') {
      await supabase
        .from('experiments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          winner_variant_index: winner.variant_index,
          statistical_significance: significance,
          results_summary: {
            winner_name: winner.variant_name,
            improvement_percentage: improvement,
            confidence: significance
          }
        })
        .eq('id', experimentId);
    }

    return {
      experiment: experiment as Experiment,
      variants: variants as ExperimentVariantStats[],
      winner: isConclusive ? {
        variant: winner as ExperimentVariantStats,
        improvement_percentage: improvement
      } : undefined,
      statistical_significance: significance,
      is_conclusive: isConclusive,
      recommendation
    };
  }

  /**
   * Get all experiments for a user
   */
  static async getExperiments(userId: string, status?: Experiment['status']): Promise<Experiment[]> {
    let query = supabase
      .from('experiments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch experiments: ${error.message}`);
    return data as Experiment[];
  }

  /**
   * Get experiment details with variants
   */
  static async getExperimentDetails(experimentId: string): Promise<{ experiment: Experiment; variants: ExperimentVariantStats[] }> {
    const { data: experiment } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    const { data: variants } = await supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('variant_index', { ascending: true });

    if (!experiment) throw new Error('Experiment not found');

    return {
      experiment: experiment as Experiment,
      variants: (variants || []) as ExperimentVariantStats[]
    };
  }

  /**
   * Cancel an experiment
   */
  static async cancelExperiment(experimentId: string): Promise<void> {
    const { error } = await supabase
      .from('experiments')
      .update({ status: 'cancelled' })
      .eq('id', experimentId);

    if (error) throw new Error(`Failed to cancel experiment: ${error.message}`);
  }

  /**
   * Delete an experiment
   */
  static async deleteExperiment(experimentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', experimentId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete experiment: ${error.message}`);
  }

  /**
   * Get experiment recommendations based on past data
   */
  static async getExperimentRecommendations(userId: string): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze past posts to suggest experiments
    const { data: posts } = await supabase
      .from('posts')
      .select(`content, analytics (engagement_rate)`)
      .eq('user_id', userId)
      .eq('status', 'published')
      .limit(50);

    if (!posts || posts.length < 20) {
      return ['Collect more post data before running experiments (minimum 20 posts recommended)'];
    }

    // Check emoji usage correlation
    const withEmoji = posts.filter((p: any) => /[\u{1F600}-\u{1F64F}]/u.test(p.content));
    const withoutEmoji = posts.filter((p: any) => !/[\u{1F600}-\u{1F64F}]/u.test(p.content));
    
    if (withEmoji.length > 5 && withoutEmoji.length > 5) {
      recommendations.push('Test emoji usage - you have enough data to compare performance');
    }

    // Check question vs statement
    const questions = posts.filter((p: any) => p.content.includes('?'));
    const statements = posts.filter((p: any) => !p.content.includes('?'));
    
    if (questions.length > 5 && statements.length > 5) {
      recommendations.push('Test questions vs statements - see which format your audience prefers');
    }

    // Check posting time variety
    recommendations.push('Test different posting times - find your optimal engagement window');

    // Check content length
    recommendations.push('Test short vs long posts - determine your ideal content length');

    return recommendations;
  }
}
