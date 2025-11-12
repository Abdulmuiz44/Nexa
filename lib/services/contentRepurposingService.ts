import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ContentSource, RepurposedContent } from '@/types/features';

let cachedSupabase: SupabaseClient | null | undefined = undefined;

function ensureSupabase(): SupabaseClient {
  if (cachedSupabase !== undefined) {
    if (!cachedSupabase) {
      throw new Error('Supabase configuration missing for ContentRepurposingService.');
    }
    return cachedSupabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    cachedSupabase = null;
    throw new Error('Supabase configuration missing for ContentRepurposingService.');
  }

  cachedSupabase = createClient(supabaseUrl, supabaseKey);
  return cachedSupabase;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class ContentRepurposingService {
  /**
   * Import and process content from URL or text
   */
  static async importContent(
    userId: string,
    sourceType: ContentSource['source_type'],
    title: string,
    content: string,
    sourceUrl?: string
  ): Promise<ContentSource> {
    // Extract key points from content using AI
    const extractedPoints = await this.extractKeyPoints(content);

    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('content_sources')
      .insert({
        user_id: userId,
        source_type: sourceType,
        source_url: sourceUrl,
        title: title,
        raw_content: content,
        extracted_points: extractedPoints,
        processed: false,
        metadata: {
          word_count: content.split(/\s+/).length,
          imported_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to import content: ${error.message}`);
    return data as ContentSource;
  }

  /**
   * Extract key points from content using AI
   */
  private static async extractKeyPoints(content: string): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a content analyst. Extract 10-15 key points, insights, or interesting facts from the provided content. Each point should be clear, standalone, and suitable for social media posts.'
          },
          {
            role: 'user',
            content: `Extract key points from this content:\n\n${content.slice(0, 4000)}`
          }
        ],
        temperature: 0.7,
      });

      const pointsText = response.choices[0]?.message?.content || '';
      const points = pointsText
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-•*\d.)\]]\s*/, '').trim())
        .filter(point => point.length > 10);

      return points.slice(0, 15);
    } catch (error) {
      console.error('Error extracting key points:', error);
      // Fallback: split content into sentences
      return content
        .split(/[.!?]+/)
        .filter(s => s.trim().length > 20)
        .slice(0, 10)
        .map(s => s.trim());
    }
  }

  /**
   * Generate multiple social posts from a content source
   */
  static async repurposeContent(
    sourceId: string,
    userId: string,
    numPosts: number = 10
  ): Promise<RepurposedContent[]> {
    // Get the content source
    const supabase = ensureSupabase();
    const { data: source, error: sourceError } = await supabase
      .from('content_sources')
      .select('*')
      .eq('id', sourceId)
      .eq('user_id', userId)
      .single();

    if (sourceError) throw new Error(`Content source not found: ${sourceError.message}`);

    const angles: Array<RepurposedContent['angle']> = [
      'tip', 'question', 'statistic', 'quote', 'how-to', 'thread'
    ];

    const repurposedPosts: RepurposedContent[] = [];

    // Generate posts with different angles
    for (let i = 0; i < Math.min(numPosts, source.extracted_points.length); i++) {
      const angle = angles[i % angles.length];
      const point = source.extracted_points[i];

      const generatedContent = await this.generatePostFromPoint(
        point,
        angle,
        source.title,
        source.source_type
      );

      const supabaseClient = ensureSupabase();
      const { data, error } = await supabaseClient
        .from('repurposed_content')
        .insert({
          source_id: sourceId,
          user_id: userId,
          angle: angle,
          generated_content: generatedContent,
          used: false
        })
        .select()
        .single();

      if (!error && data) {
        repurposedPosts.push(data as RepurposedContent);
      }
    }

    // Mark source as processed
    await supabase
      .from('content_sources')
      .update({ processed: true })
      .eq('id', sourceId);

    return repurposedPosts;
  }

  /**
   * Generate a single post from a key point with specific angle
   */
  private static async generatePostFromPoint(
    keyPoint: string,
    angle: RepurposedContent['angle'],
    sourceTitle: string,
    sourceType: string
  ): Promise<string> {
    const anglePrompts = {
      tip: 'Turn this into a helpful tip or advice (max 280 chars)',
      question: 'Turn this into an engaging question that sparks discussion (max 280 chars)',
      statistic: 'Present this as an interesting statistic or fact (max 280 chars)',
      quote: 'Format this as a memorable quote or insight (max 280 chars)',
      'how-to': 'Turn this into a quick how-to or actionable step (max 280 chars)',
      thread: 'Create the first tweet of a thread about this topic (max 280 chars)'
    };

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a social media content creator. Create engaging posts that are authentic, valuable, and shareable. Keep posts under 280 characters for Twitter compatibility.`
          },
          {
            role: 'user',
            content: `Key point: ${keyPoint}\n\nSource: ${sourceTitle} (${sourceType})\n\nTask: ${anglePrompts[angle]}`
          }
        ],
        temperature: 0.8,
        max_tokens: 100,
      });

      return response.choices[0]?.message?.content?.trim() || keyPoint.slice(0, 280);
    } catch (error) {
      console.error('Error generating post:', error);
      return keyPoint.slice(0, 280);
    }
  }

  /**
   * Get all content sources for a user
   */
  static async getContentSources(userId: string): Promise<ContentSource[]> {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('content_sources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch content sources: ${error.message}`);
    return data as ContentSource[];
  }

  /**
   * Get repurposed content for a source
   */
  static async getRepurposedContent(
    sourceId: string,
    userId: string
  ): Promise<RepurposedContent[]> {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('repurposed_content')
      .select('*')
      .eq('source_id', sourceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch repurposed content: ${error.message}`);
    return data as RepurposedContent[];
  }

  /**
   * Mark repurposed content as used
   */
  static async markAsUsed(contentId: string, postId: string): Promise<void> {
    const supabase = ensureSupabase();
    const { error } = await supabase
      .from('repurposed_content')
      .update({ used: true, post_id: postId })
      .eq('id', contentId);

    if (error) throw new Error(`Failed to mark content as used: ${error.message}`);
  }

  /**
   * Get unused repurposed content
   */
  static async getUnusedContent(userId: string, limit: number = 20): Promise<RepurposedContent[]> {
    const supabase = ensureSupabase();
    const { data, error } = await supabase
      .from('repurposed_content')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch unused content: ${error.message}`);
    return data as RepurposedContent[];
  }

  /**
   * Delete content source and all repurposed content
   */
  static async deleteContentSource(sourceId: string, userId: string): Promise<void> {
    const supabase = ensureSupabase();
    const { error } = await supabase
      .from('content_sources')
      .delete()
      .eq('id', sourceId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to delete content source: ${error.message}`);
  }

  /**
   * Extract content from URL (basic implementation)
   */
  static async extractFromUrl(url: string): Promise<{ title: string; content: string }> {
    try {
      // In production, use a proper article extraction service
      // For now, we'll return a placeholder
      const response = await fetch(url);
      const html = await response.text();
      
      // Basic title extraction
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Imported Content';
      
      // Basic content extraction (very simplified)
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      let content = bodyMatch ? bodyMatch[1] : html;
      
      // Remove HTML tags
      content = content.replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000);
      
      return { title, content };
    } catch (error) {
      throw new Error(`Failed to extract content from URL: ${error}`);
    }
  }
}
