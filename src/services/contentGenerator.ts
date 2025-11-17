import { callUserLLM } from '@/src/lib/ai/user-provider';
import { supabaseServer } from '@/src/lib/supabaseServer';

export interface UserProfile {
  businessName: string;
  businessType: string;
  websiteUrl?: string;
  promotionGoals: string[];
  postingFrequency: string;
  brandTone: string;
  sampleCaption?: string;
}

export interface ContentRequest {
  platform: 'twitter' | 'reddit';
  topic?: string;
  campaignId?: string;
  userProfile: UserProfile;
}

export interface GeneratedContent {
  content: string;
  hashtags?: string[];
  callToAction?: string;
  platform: string;
  confidence: number;
  metadata: {
    tone: string;
    goals: string[];
    businessType: string;
    optimized?: boolean;
    originalPerformance?: number;
  };
}

export class ContentGenerator {
  async generateContent(userId: string, request: ContentRequest): Promise<GeneratedContent> {
    const { platform, topic, userProfile } = request;

    // Build the prompt based on user profile
    const prompt = this.buildPrompt(platform, topic, userProfile);

    try {
      const systemMessage = `You are a professional social media content strategist specializing in ${platform} content creation. Generate engaging, brand-consistent content that drives the specified goals.`;
      const aiResponse = await callUserLLM({
        userId,
        payload: {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        }
      });

      const generatedText = aiResponse.message.trim();

      if (!generatedText) {
        throw new Error('No content generated');
      }

      return this.parseAndEnhanceContent(generatedText, platform, userProfile);
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  private buildPrompt(platform: string, topic: string | undefined, userProfile: UserProfile): string {
    const { businessName, businessType, promotionGoals, brandTone, sampleCaption } = userProfile;

    let prompt = `Generate a ${platform} post for ${businessName}, a ${businessType} company.

BRAND VOICE: ${brandTone}
GOALS: ${promotionGoals.join(', ')}

`;

    if (sampleCaption) {
      prompt += `SAMPLE STYLE: "${sampleCaption}"

`;
    }

    if (topic) {
      prompt += `TOPIC: ${topic}

`;
    }

    const platformInstructions = platform === 'twitter'
      ? `Twitter requirements:
- Maximum 280 characters
- Include relevant hashtags
- End with call-to-action
- Use emojis sparingly but effectively
- Make it conversational and engaging`
      : `Reddit requirements:
- Title should be compelling and click-worthy
- Post content should provide value
- Include relevant subreddit context
- Encourage discussion
- Use proper formatting (if applicable)`;

    prompt += `${platformInstructions}

Generate content that aligns with the brand voice and achieves the specified goals. Make it authentic and engaging for the target audience.`;

    return prompt;
  }

  private parseAndEnhanceContent(content: string, platform: string, userProfile: UserProfile): GeneratedContent {
    // Extract hashtags if present
    const hashtagRegex = /#[\w]+/g;
    const hashtags = content.match(hashtagRegex) || [];

    // Remove hashtags from content for clean text
    let cleanContent = content.replace(hashtagRegex, '').trim();

    // Add call-to-action if not present
    let callToAction = '';
    if (!cleanContent.includes('DM') && !cleanContent.includes('link in bio') && !cleanContent.includes('check out')) {
      if (userProfile.websiteUrl) {
        callToAction = `Check out ${userProfile.websiteUrl}`;
      } else {
        callToAction = 'Learn more!';
      }
    }

    return {
      content: cleanContent,
      hashtags,
      callToAction,
      platform,
      confidence: 0.85, // Could be calculated based on various factors
      metadata: {
        tone: userProfile.brandTone,
        goals: userProfile.promotionGoals,
        businessType: userProfile.businessType,
      },
    };
  }

  async generateContentSeries(userId: string, request: ContentRequest & { count: number }): Promise<GeneratedContent[]> {
    const contents: GeneratedContent[] = [];

    for (let i = 0; i < request.count; i++) {
      const content = await this.generateContent(userId, request);
      contents.push(content);

      // Add slight delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return contents;
  }

  async optimizeContent(userId: string, content: GeneratedContent, analytics?: any): Promise<GeneratedContent> {
    if (!analytics) return content;

    // Use analytics to optimize future content
    const engagementRate = analytics.engagementRate || 0;
    const impressions = analytics.impressions || 0;

    // Only optimize if we have meaningful data
    if (impressions < 10) return content;

    const performanceLevel = engagementRate > 3 ? 'high' : engagementRate > 1 ? 'medium' : 'low';

    const optimizationPrompt = `Analyze these performance metrics and suggest improvements for similar content:

Performance: ${performanceLevel} (${engagementRate}% engagement rate, ${impressions} impressions)
Original content: "${content.content}"
Platform: ${content.platform}
Business goals: ${content.metadata.goals.join(', ')}

Suggest an improved version that would perform better. Focus on:
- More engaging hooks if engagement is low
- Better calls-to-action
- Optimal content length
- Hashtag strategy
- Emotional triggers that work for ${content.metadata.businessType}`;

    try {
      const aiResponse = await callUserLLM({
        userId,
        payload: {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a social media optimization expert. Analyze performance data and suggest specific content improvements while maintaining brand voice.'
            },
            {
              role: 'user',
              content: optimizationPrompt
            }
          ],
          temperature: 0.7
        }
      });

      const optimizedContent = aiResponse.message.trim();

      if (optimizedContent && optimizedContent !== content.content && optimizedContent.length > 10) {
        return {
          ...content,
          content: optimizedContent,
          confidence: Math.min(content.confidence + 0.2, 1.0), // Boost confidence but cap at 1.0
          metadata: {
            ...content.metadata,
            optimized: true,
            originalPerformance: engagementRate,
          }
        };
      }
    } catch (error) {
      console.error('Content optimization error:', error);
    }

    return content;
  }

  async learnFromAnalytics(userId: string): Promise<void> {
    // Analyze user's content performance over time to improve future generation
    try {
      // Get recent analytics
      const { data: analytics } = await supabaseServer
        .from('analytics')
        .select(`
          *,
          posts!inner(content, platform, metadata)
        `)
        .eq('posts.user_id', userId)
        .order('fetched_at', { ascending: false })
        .limit(50);

      if (!analytics || analytics.length < 5) return;

      // Analyze patterns
      const highPerforming = analytics.filter(a => a.engagement_rate > 2);
      const lowPerforming = analytics.filter(a => a.engagement_rate < 0.5);

      // Extract successful patterns
      const successfulElements = this.extractPatterns(highPerforming);
      const avoidElements = this.extractPatterns(lowPerforming, true);

      // Store learning for future use
      // First fetch current onboarding data
      const { data: currentUser } = await supabaseServer
        .from('users')
        .select('onboarding_data')
        .eq('id', userId)
        .single();

      const currentOnboardingData = currentUser?.onboarding_data || {};
      const newOnboardingData = {
        ...currentOnboardingData,
        ai_learning: {
          successful_patterns: successfulElements,
          avoid_patterns: avoidElements,
          last_updated: new Date().toISOString(),
        }
      };

      await supabaseServer
        .from('users')
        .update({
          onboarding_data: newOnboardingData
        })
        .eq('id', userId);

    } catch (error) {
      console.error('Error learning from analytics:', error);
    }
  }

  private extractPatterns(analytics: any[], avoid = false): string[] {
    const patterns: string[] = [];
    const contents = analytics.map(a => a.posts.content);

    // Simple pattern extraction (could be more sophisticated)
    const commonWords = this.findCommonWords(contents);
    const avgLength = contents.reduce((sum, c) => sum + c.length, 0) / contents.length;

    if (avoid) {
      patterns.push(`Avoid ${avgLength < 50 ? 'very short' : avgLength > 200 ? 'very long' : 'medium length'} posts`);
      if (commonWords.length > 0) {
        patterns.push(`Avoid overusing words like: ${commonWords.slice(0, 3).join(', ')}`);
      }
    } else {
      patterns.push(`Use ${avgLength < 50 ? 'short' : avgLength > 200 ? 'long' : 'medium length'} posts`);
      if (commonWords.length > 0) {
        patterns.push(`Effective words: ${commonWords.slice(0, 3).join(', ')}`);
      }
    }

    return patterns;
  }

  private findCommonWords(contents: string[]): string[] {
    const wordCount: { [key: string]: number } = {};

    contents.forEach(content => {
      const words = content.toLowerCase().match(/\b\w+\b/g) || [];
      words.forEach(word => {
        if (word.length > 3) { // Skip short words
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCount)
      .filter(([, count]) => count > contents.length * 0.3) // Appears in >30% of posts
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}

export const contentGenerator = new ContentGenerator();
