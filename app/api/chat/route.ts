import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';
import OpenAI from 'openai';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { composioHelpers } from '@/lib/composioClient';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, userId, agentMode = 'manual' } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize OpenAI (gracefully handle missing key in dev)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let openai: OpenAI | null = null;
    if (openaiApiKey) {
      openai = new OpenAI({ apiKey: openaiApiKey });
    }

    // Get user onboarding data for context
    const { data: userData } = await supabaseServer
      .from('users')
      .select('onboarding_data, plan')
      .eq('id', session.user.id)
      .single();

    const onboardingContext = userData?.onboarding_data || {};
    const userPlan = userData?.plan || 'free';

    // Helper function to execute tools
    const executeTool = async (toolCall: any, userId: string) => {
      const functionCall = toolCall.function || toolCall;
      const { name, arguments: args } = functionCall;
      const params = JSON.parse(args);

      switch (name) {
        case 'post_to_twitter':
          // Check credits first
          const { data: creditData } = await supabaseServer
            .from('credits_wallet')
            .select('balance')
            .eq('user_id', userId)
            .single();

          if (!creditData || creditData.balance < 1) {
            throw new Error('Insufficient credits. You need at least 1 credit to post on Twitter.');
          }

          // Deduct credit
          await supabaseServer
            .from('credits_wallet')
            .update({ balance: creditData.balance - 1 })
            .eq('user_id', userId);

          // Record transaction
          await supabaseServer
            .from('credit_transactions')
            .insert({
              user_id: userId,
              tx_type: 'spend',
              credits: -1,
              description: 'Twitter post via Nexa chat',
            });

          // Post to Twitter
          const twitterResult = await composioHelpers.postToTwitter(params.content, userId);
          return { success: true, platform: 'Twitter', result: twitterResult };

        case 'post_to_reddit':
          // Check credits first
          const { data: redditCreditData } = await supabaseServer
            .from('credits_wallet')
            .select('balance')
            .eq('user_id', userId)
            .single();

          if (!redditCreditData || redditCreditData.balance < 1) {
            throw new Error('Insufficient credits. You need at least 1 credit to post on Reddit.');
          }

          // Deduct credit
          await supabaseServer
            .from('credits_wallet')
            .update({ balance: redditCreditData.balance - 1 })
            .eq('user_id', userId);

          // Record transaction
          await supabaseServer
            .from('credit_transactions')
            .insert({
              user_id: userId,
              tx_type: 'spend',
              credits: -1,
              description: 'Reddit post via Nexa chat',
            });

          // Post to Reddit
          const redditResult = await composioHelpers.postToReddit(params.subreddit, params.title, params.content, userId);
          return { success: true, platform: 'Reddit', result: redditResult };

        case 'get_twitter_analytics':
          const analyticsResult = await composioHelpers.getTwitterAnalytics(params.tweetId, userId);
          return { success: true, analytics: analyticsResult };

        case 'check_credit_balance':
          const { data: balanceData } = await supabaseServer
            .from('credits_wallet')
            .select('balance')
            .eq('user_id', userId)
            .single();

          return { balance: balanceData?.balance || 0 };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    };

    // Define available tools
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "post_to_twitter",
          description: "Post content to Twitter/X. Requires user authentication.",
          parameters: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The content to post on Twitter/X"
              }
            },
            required: ["content"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "post_to_reddit",
          description: "Post content to a Reddit subreddit. Requires user authentication.",
          parameters: {
            type: "object",
            properties: {
              subreddit: {
                type: "string",
                description: "The subreddit name (without r/)"
              },
              title: {
                type: "string",
                description: "The post title"
              },
              content: {
                type: "string",
                description: "The post content"
              }
            },
            required: ["subreddit", "title", "content"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_twitter_analytics",
          description: "Get analytics for a Twitter post.",
          parameters: {
            type: "object",
            properties: {
              tweetId: {
                type: "string",
                description: "The tweet ID to get analytics for"
              }
            },
            required: ["tweetId"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "check_credit_balance",
          description: "Check the user's current credit balance.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ];

    // Create system prompt with user context
    let systemPrompt = `You are Nexa, an AI-powered social media assistant. You help users manage their social media presence across platforms like Twitter/X and Reddit.

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

For content creation, match the user's brand tone and business type. Be creative but authentic.

Each social media post costs 1 credit. Always check credit balance before posting.`;

    // Adjust behavior based on agent mode
    if (agentMode === 'autonomous') {
      systemPrompt += '\n\nAUTONOMOUS MODE: Execute actions immediately when users request them. Take initiative to optimize their social media strategy. Be proactive in suggesting and implementing improvements.';
    } else if (agentMode === 'review') {
      systemPrompt += '\n\nREVIEW MODE: Propose actions for user approval before executing. Always ask for confirmation before performing any social media actions.';
    } else {
      systemPrompt += '\n\nMANUAL MODE: Only execute actions when explicitly requested by the user. Provide guidance and suggestions but wait for user approval.';
    }

    // Use OpenAI to process the message (or fallback when key absent)
    let aiResponse = '';
    let toolCalls: any[] | undefined = undefined;
    let totalTokensUsed = 0;
    const openaiResponseIds: string[] = [];

    if (!openai) {
      aiResponse = `Dev mode: OPENAI_API_KEY not set. Echo: "${message}"`;
    } else {
      const { getCreditBalance } = await import('@/lib/utils/credits');
      const preBalance = await getCreditBalance(session.user.id);
      if (preBalance <= 0) {
        return NextResponse.json({ error: 'Insufficient credits. Please top up.' }, { status: 402 });
      }

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        tools: tools,
        tool_choice: "auto",
      });

      aiResponse = completion.choices[0]?.message?.content || '';
      toolCalls = completion.choices[0]?.message?.tool_calls;
      try {
        totalTokensUsed += Number((completion as any).usage?.total_tokens || 0);
        if ((completion as any).id) openaiResponseIds.push((completion as any).id);
      } catch {}
    }

    // Handle tool calls if any
    if (toolCalls && toolCalls.length > 0 && openai) {
      const toolResults = [];

      for (const toolCall of toolCalls) {
        try {
          const result = await executeTool(toolCall, session.user.id);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify(result),
          });
        } catch (error) {
          console.error('Tool execution error:', error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify({ error: error instanceof Error ? error.message : 'Tool execution failed' }),
          });
        }
      }

      // Make another OpenAI call with tool results
      const followUpCompletion = await openai!.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
          {
            role: 'assistant',
            content: aiResponse,
            tool_calls: toolCalls,
          },
          ...toolResults,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      aiResponse = followUpCompletion.choices[0]?.message?.content || 'Action completed, but I couldn\'t generate a response.';
      try {
        totalTokensUsed += Number((followUpCompletion as any).usage?.total_tokens || 0);
        if ((followUpCompletion as any).id) openaiResponseIds.push((followUpCompletion as any).id);
      } catch {}
    }

    // Save conversation to database
    try {
      // Get or create conversation
      let { data: conversation } = await supabaseServer
        .from('conversations')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('source', 'web')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!conversation) {
        const { data: newConversation } = await supabaseServer
          .from('conversations')
          .insert({
            user_id: session.user.id,
            source: 'web',
          })
          .select('id')
          .single();
        conversation = newConversation;
      }

      // Save user message
      await supabaseServer
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: message,
          metadata: { timestamp: new Date().toISOString() },
        });

      // Save assistant response
      await supabaseServer
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            timestamp: new Date().toISOString(),
            tool_calls: toolCalls ? toolCalls.length : 0
          },
        });

    } catch (dbError) {
      console.error('Error saving conversation:', dbError);
      // Don't fail the request if DB save fails
    }

    // Deduct credits for OpenAI usage (if any)
    try {
      if (openai && totalTokensUsed > 0) {
        const { recordOpenAIUsage } = await import('@/lib/utils/credits');
        await recordOpenAIUsage(session.user.id, { total_tokens: totalTokensUsed }, {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          response_ids: openaiResponseIds,
          endpoint: 'chat_api',
        });
      }
    } catch (spendErr) {
      console.error('Credit deduction error:', spendErr);
    }

    // Prepare response data
    const responseData: any = {
      response: aiResponse,
      success: true,
      dev: !openai,
    };

    // If there were tool calls, include action results
    if (toolCalls && toolCalls.length > 0) {
      responseData.actions = toolCalls.map((call, index) => ({
        id: call.id,
        name: (call.function || call).name,
        status: 'completed',
        result: 'Action executed successfully',
      }));
    }

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error('Chat error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process chat message'
    }, { status: 500 });
  }
}
