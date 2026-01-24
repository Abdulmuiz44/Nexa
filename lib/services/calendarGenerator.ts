import { supabaseServer } from '@/src/lib/supabaseServer';
import { callUserLLM } from '@/src/lib/ai/user-provider';
import { executeMCPTool } from '@/lib/mcpClient';
import { recordAIUsage } from '@/lib/utils/credits';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

export interface CalendarGenerationOptions {
    userId: string;
    topics: string[];
    platforms: ('twitter' | 'reddit')[];
    days?: number;
}

export class CalendarGenerator {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    async generate30DayCalendar(options: CalendarGenerationOptions): Promise<{ success: true, postCount: number } | { success: false, error: string }> {
        const { topics, platforms, days = 30 } = options;
        logger.info('agent', `Starting 30-day calendar generation for user ${this.userId}`, { topics, platforms });

        try {
            // 1. Research trends for the topics using MCP
            const researchContext = await this.performBulkResearch(topics);

            // 2. Generate content ideas in bulk
            const posts = await this.generateBulkContent(topics, platforms, days, researchContext);

            // 3. Save to database as scheduled posts
            await this.schedulePosts(posts);

            logger.info('agent', `Successfully generated and scheduled ${posts.length} posts for user ${this.userId}`);
            return { success: true, postCount: posts.length };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error('error', `Failed to generate calendar for user ${this.userId}: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }

    private async performBulkResearch(topics: string[]): Promise<string> {
        const combinedTopics = topics.join(', ');
        try {
            logger.info('agent', `Performing MCP research for topics: ${combinedTopics}`);
            const searchResult = await executeMCPTool('SEARCH', 'brave_web_search', {
                query: `${combinedTopics} latest marketing trends 2026`
            }, 20000); // 20s timeout for bulk research
            return (searchResult as any).map((r: any) => r.snippet).join('\n\n');
        } catch (error) {
            logger.warn('agent', `MCP Research failed or timed out: ${error instanceof Error ? error.message : String(error)}. Proceeding with LLM knowledge only.`);
            return '';
        }
    }

    private async generateBulkContent(topics: string[], platforms: string[], days: number, context: string): Promise<any[]> {
        const prompt = `
Context from Live Web Search (2026):
${context || 'No live data available.'}

User Topics: ${topics.join(', ')}
Platforms to target: ${platforms.join(', ')}
Total Days to plan: ${days}

Generate a content calendar in JSON format. 
Each day should have 1-2 posts across the specified platforms.
Spread them out realistically across the ${days} days starting from tomorrow.

Return a JSON array of objects:
[
  { 
    "platform": "twitter" | "reddit",
    "content": "the actual post content...",
    "scheduled_at": "ISO string format",
    "metadata": { "topic": "..." }
  },
  ...
]

Rules:
- Twitter posts MUST be under 280 chars.
- Reddit posts should include a hypothetical title if applicable (format as: TITLE: ... CONTENT: ...).
- Dates should be distributed from day 1 to day ${days}.
- Ensure high engagement and variety.
- RETURN ONLY THE JSON ARRAY. NO MARKDOWN BLOCK.
`;

        const response = await callUserLLM({
            userId: this.userId,
            payload: {
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: 'You are an expert Content Strategist. You return raw JSON arrays only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            }
        });

        try {
            let rawJson = response.message.trim();
            // Remove backticks if present
            if (rawJson.startsWith('```json')) {
                rawJson = rawJson.replace(/^```json/, '').replace(/```$/, '');
            } else if (rawJson.startsWith('```')) {
                rawJson = rawJson.replace(/^```/, '').replace(/```$/, '');
            }

            const parsedPosts = JSON.parse(rawJson);

            // Record usage
            const total = (response.usage as any)?.total_tokens || 0;
            if (total > 0) await recordAIUsage(this.userId, { total_tokens: total }, { model: response.model, endpoint: 'calendar_generator' });

            return parsedPosts;
        } catch (e) {
            logger.error('error', 'Failed to parse LLM response as JSON', { response: response.message });
            throw new Error('AI failed to generate a valid calendar format. Please try again.');
        }
    }

    private async schedulePosts(posts: any[]): Promise<void> {
        const formattedPosts = posts.map(p => ({
            user_id: this.userId,
            platform: p.platform,
            content: p.content,
            status: 'pending',
            scheduled_at: p.scheduled_at,
            metadata: { ...p.metadata, generated_by: 'calendar_generator' }
        }));

        const { error } = await supabaseServer.from('scheduled_posts').insert(formattedPosts);
        if (error) throw error;
    }
}
