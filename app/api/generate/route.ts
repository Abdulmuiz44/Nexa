import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { crawlContext } from '@/utils/crawler';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { callUserLLM } from '@/src/lib/ai/user-provider';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Verify user exists in database
    const { data: userExists } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!userExists) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const body = await req.json();
    const {
      toolName,
      toolDescription,
      websiteUrl,
      platform,
      tone,
      contentType,
    } = body;

    if (!toolName || !toolDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const websiteContext = await crawlContext(websiteUrl, process.env.SCIRA_API_KEY);

    const prompt = `
      You are Nexa, an AI Growth Agent.
      Here is context from the user’s website:
      ${websiteContext}

      Generate a ${contentType} for ${platform} in a ${tone} tone.
      Tool: ${toolName}
      Description: ${toolDescription}
    `;

    // Pre-check wallet
    const { getCreditBalance, recordAIUsage } = await import('@/lib/utils/credits');
    const preBalance = await getCreditBalance(userId);
    if (preBalance <= 0) {
      return NextResponse.json({ error: 'Insufficient credits. Please top up.' }, { status: 402 });
    }

    const aiResponse = await callUserLLM({
      userId,
      payload: {
        model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      },
    });

    const content = aiResponse.message?.trim();

    // Deduct credits based on tokens
    try {
      const usage = aiResponse.usage || {};
      const anyUsage = usage as any;
      const total = Number(anyUsage.total_tokens ?? anyUsage.totalTokens ?? 0);
      if (total > 0) {
        await recordAIUsage(userId, { total_tokens: total }, { model: aiResponse.model || process.env.MISTRAL_MODEL || 'mistral-large-latest', endpoint: 'generate_api' });
      }
    } catch (e) {
      console.error('credit deduction (generate) error', e);
    }

    if (!content) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    const { error: dbError } = await supabaseServer.from('generated_contents').insert({
      user_id: userId,
      tool_name: toolName,
      tool_description: toolDescription,
      website_url: websiteUrl,
      website_context: websiteContext,
      platform,
      tone,
      content_type: contentType,
      generated_content: content,
    });

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      // We don't want to fail the whole request if only the save fails
      // So we'll return the content anyway but with a flag
      return NextResponse.json({ success: true, content, saved: false });
    }

    return NextResponse.json({ success: true, content, saved: true });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }, { status: 500 });
  }
}
