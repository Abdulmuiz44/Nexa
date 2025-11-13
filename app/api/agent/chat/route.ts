import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, userId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get user onboarding data for context
    const { data: userData } = await supabaseServer
      .from('users')
      .select('onboarding_data, plan')
      .eq('id', session.user.id)
      .single();

    const onboardingContext = userData?.onboarding_data || {};
    const userPlan = userData?.plan || 'free';

    // Create system prompt with user context
    const systemPrompt = `You are Nexa, an AI-powered social media assistant. You help users manage their social media presence across platforms like Twitter/X and Reddit.

User Context:
- Business: ${onboardingContext.business_name || 'Not specified'}
- Type: ${onboardingContext.business_type || 'Not specified'}
- Brand Tone: ${onboardingContext.brand_tone || 'Professional'}
- Goals: ${onboardingContext.promotion_goals?.join(', ') || 'Not specified'}
- Posting Frequency: ${onboardingContext.posting_frequency || 'Not specified'}
- Plan: ${userPlan}

You can perform various social media tasks including:
1. Content creation and optimization
2. Posting to Twitter/X and Reddit (when authenticated)
3. Campaign management and scheduling
4. Analytics and performance tracking
5. Community engagement
6. Trend analysis

Always be helpful, professional, and focused on achieving the user's social media goals. If you need to perform actions on social media platforms, use the available tools.

For content creation, match the user's brand tone and business type. Be creative but authentic.`;

    // Pre-check wallet
    const { getCreditBalance, recordOpenAIUsage } = await import('@/lib/utils/credits');
    const preBalance = await getCreditBalance(session.user.id);
    if (preBalance <= 0) {
      return NextResponse.json({ error: 'Insufficient credits. Please top up.' }, { status: 402 });
    }

    // Use OpenAI to process the message and determine if action is needed
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your request properly.';

    // Deduct credits based on tokens
    try {
      const usage = (completion as any).usage || {};
      const total = Number(usage.total_tokens || 0);
      if (total > 0) {
        await recordOpenAIUsage(session.user.id, { total_tokens: total }, { model: process.env.OPENAI_MODEL || 'gpt-4o-mini', response_ids: [(completion as any).id], endpoint: 'agent_chat_api' });
      }
    } catch (e) {
      console.error('credit deduction (agent chat) error', e);
    }

    // Check if the response indicates an action should be taken
    // For now, we'll return the AI response
    // TODO: Integrate with Composio for actual social media actions

    return NextResponse.json({
      response: aiResponse,
      success: true
    });

  } catch (error: unknown) {
    console.error('Agent chat error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process chat message'
    }, { status: 500 });
  }
}
