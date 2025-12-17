import { mistral } from '@/src/lib/ai/mistral-client';
import { supabaseServer } from '@/src/lib/supabaseServer';

export interface ContentHubItem {
    id?: string;
    user_id: string;
    title: string;
    raw_content: string;
    content_type: 'tweet' | 'thread' | 'blog' | 'video' | 'image' | 'other';
    source_url?: string;
    tags?: string[];
    summary?: string;
    engagement_potential?: number;
    campaign_id?: string;
    metadata?: any;
    status?: 'draft' | 'processed' | 'used';
    created_at?: string;
    updated_at?: string;
}

export class ContentHubService {
    /**
     * Ingest new content into the hub and trigger AI processing
     */
    static async ingestContent(userId: string, data: Partial<ContentHubItem>): Promise<ContentHubItem> {
        // 1. Initial Storage
        const { data: item, error } = await supabaseServer
            .from('content_hub')
            .insert({
                user_id: userId,
                title: data.title || 'Untitled Content',
                raw_content: data.raw_content,
                content_type: data.content_type || 'other',
                source_url: data.source_url,
                metadata: data.metadata || {},
                status: 'draft'
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to ingest content: ${error.message}`);

        // 2. Trigger AI Analysis (Async)
        // We don't await this to keep the response fast, 
        // but for the sake of this implementation we'll show the logic
        this.processContent(item.id, userId, item.raw_content).catch(err => {
            console.error(`AI Processing failed for item ${item.id}:`, err);
        });

        return item as ContentHubItem;
    }

    /**
     * AI Workflow: Tagging, Summarization, and Engagement Scoring using Mistral
     */
    private static async processContent(itemId: string, userId: string, content: string) {
        try {
            const prompt = `
        Analyze the following content for a social media growth hub.
        
        Content:
        "${content.slice(0, 5000)}"
        
        Tasks:
        1. Summarize the core message into a single, punchy paragraph (max 3 sentences).
        2. Identify 5-8 relevant SEO and social media tags (comma separated).
        3. Rate the engagement potential from 0 to 100 based on how "viral-ready" or "hook-heavy" the content is.
        
        Format your response EXCLUSIVELY as a JSON object:
        {
          "summary": "...",
          "tags": ["tag1", "tag2"],
          "engagement_potential": 85
        }
      `;

            const response = await mistral.chat([
                { role: 'system', content: 'You are an expert social media analyst and content strategist.' },
                { role: 'user', content: prompt }
            ], { temperature: 0.3 });

            const result = JSON.parse(response.message);

            await supabaseServer
                .from('content_hub')
                .update({
                    summary: result.summary,
                    tags: result.tags,
                    engagement_potential: result.engagement_potential,
                    status: 'processed'
                })
                .eq('id', itemId);

        } catch (error) {
            console.error('Error in AI content processing:', error);
            await supabaseServer
                .from('content_hub')
                .update({ status: 'processed' }) // Mark as processed even if AI fails
                .eq('id', itemId);
        }
    }

    /**
     * Get all content hub items for a user
     */
    static async getItems(userId: string): Promise<ContentHubItem[]> {
        const { data, error } = await supabaseServer
            .from('content_hub')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch items: ${error.message}`);
        return data as ContentHubItem[];
    }

    /**
     * Update a content hub item
     */
    static async updateItem(itemId: string, userId: string, data: Partial<ContentHubItem>): Promise<ContentHubItem> {
        const { data: item, error } = await supabaseServer
            .from('content_hub')
            .update(data)
            .eq('id', itemId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw new Error(`Failed to update item: ${error.message}`);
        return item as ContentHubItem;
    }

    /**
     * Delete a content hub item
     */
    static async deleteItem(itemId: string, userId: string): Promise<void> {
        const { error } = await supabaseServer
            .from('content_hub')
            .delete()
            .eq('id', itemId)
            .eq('user_id', userId);

        if (error) throw new Error(`Failed to delete item: ${error.message}`);
    }

    /**
     * Get items suitable for a specific campaign
     */
    static async getForCampaign(userId: string, campaignId: string): Promise<ContentHubItem[]> {
        const { data, error } = await supabaseServer
            .from('content_hub')
            .select('*')
            .eq('user_id', userId)
            .eq('campaign_id', campaignId);

        if (error) throw new Error(`Failed to fetch campaign items: ${error.message}`);
        return data as ContentHubItem[];
    }
}
