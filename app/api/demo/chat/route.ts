import { NextResponse } from 'next/server';
import { mistral } from '@/src/lib/ai/mistral-client';

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Demo system prompt - no user context needed
        const systemPrompt = `You are Nexa, an AI-powered social media assistant. You help users manage their social media presence across platforms like Twitter/X and Reddit.

You can perform various social media tasks including:
1. Content creation and optimization
2. Posting to Twitter/X and Reddit (when authenticated)
3. Campaign management and scheduling
4. Analytics and performance tracking
5. Community engagement
6. Trend analysis

This is a demo experience. Users will need to sign up to access the full functionality including actual posting, analytics, and personalized content generation.

Always be helpful, professional, and focused on demonstrating the value of Nexa. End your responses by encouraging users to sign up to unlock full features.`;

        const aiResponse = await mistral.chat(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            {
                temperature: 0.7,
                max_tokens: 500, // Limit demo responses
            }
        );

        return NextResponse.json({
            response: aiResponse.message,
            success: true,
            demo: true
        });

    } catch (error: unknown) {
        console.error('Demo chat error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to process chat message'
        }, { status: 500 });
    }
}
