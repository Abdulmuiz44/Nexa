import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { composioHelpers } from '@/lib/composioClient';
import { callUserLLM } from '@/src/lib/ai/user-provider';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, userId, agentMode = 'manual', conversationId: requestedConversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user onboarding data for context
    const { data: userData } = await supabaseServer
      .from('users')
      .select('onboarding_data, plan')
      .eq('id', session.user.id)
      .single();

    const onboardingContext = userData?.onboarding_data || {};
    const userPlan = userData?.plan || 'free';

    // Helper function to check and deduct credits
    const checkAndDeductCredit = async (userId: string, description: string) => {
      const { data: creditData } = await supabaseServer
        .from('credits_wallet')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (!creditData || creditData.balance < 1) {
        throw new Error('Insufficient credits. You need at least 1 credit for this action.');
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
          description,
        });
    };

    // Helper function to execute tools
    const executeTool = async (toolCall: any, userId: string) => {
      const functionCall = toolCall.function || toolCall;
      const { name, arguments: args } = functionCall;
      const params = JSON.parse(args);

      switch (name) {
        case 'post_to_twitter':
          await checkAndDeductCredit(userId, 'Twitter post via Nexa chat');
          const twitterResult = await composioHelpers.postToTwitter(params.content, userId);
          return { success: true, platform: 'Twitter', result: twitterResult };

        case 'post_to_reddit':
          await checkAndDeductCredit(userId, 'Reddit post via Nexa chat');
          const redditResult = await composioHelpers.postToReddit(params.subreddit, params.title, params.content, userId);
          return { success: true, platform: 'Reddit', result: redditResult };

        case 'get_twitter_timeline':
          const timeline = await composioHelpers.getTwitterTimeline(userId, params.maxResults || 20);
          return { success: true, tweets: timeline };

        case 'search_my_tweets':
          const searchResults = await composioHelpers.searchUserTweets(userId, params.query, params.maxResults || 20);
          return { success: true, tweets: searchResults };

        case 'engage_with_tweet':
          await checkAndDeductCredit(userId, `Twitter ${params.type} via Nexa chat`);
          const engageResult = await composioHelpers.engageWithTweet(userId, params.tweetId, params.type, params.replyContent);
          return { success: true, result: engageResult };

        case 'analyze_tweet':
          const analysis = await composioHelpers.analyzeTweet(userId, params.content);
          return { success: true, analysis };

        case 'generate_tweet':
          const generatedTweet = await composioHelpers.generateTweet(userId, params.topic, params.context);
          return { success: true, tweet: generatedTweet };

        case 'analyze_my_tweet_patterns':
          const patterns = await composioHelpers.analyzeTweetPatterns(userId);
          return { success: true, patterns };

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

        case 'check_connection_status':
          const isTwitterConnected = await composioHelpers.hasActiveConnection('twitter', userId);
          const isRedditConnected = await composioHelpers.hasActiveConnection('reddit', userId);
          return {
            twitter: isTwitterConnected ? 'connected' : 'not_connected',
            reddit: isRedditConnected ? 'connected' : 'not_connected',
          };

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
          description: "Post content to Twitter/X. Requires user to have connected their Twitter account.",
          parameters: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The content to post on Twitter/X (max 280 characters)"
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
          description: "Post content to a Reddit subreddit. Requires user to have connected their Reddit account.",
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
          name: "get_twitter_timeline",
          description: "Get the user's Twitter home timeline. Shows recent tweets from accounts they follow.",
          parameters: {
            type: "object",
            properties: {
              maxResults: {
                type: "number",
                description: "Maximum number of tweets to retrieve (default: 20)"
              }
            },
            required: []
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "search_my_tweets",
          description: "Search through the user's own tweet history. Useful for finding past posts on specific topics.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query to find tweets"
              },
              maxResults: {
                type: "number",
                description: "Maximum number of tweets to retrieve (default: 20)"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "engage_with_tweet",
          description: "Interact with a tweet by liking, retweeting, or replying. Helps with engagement and community building.",
          parameters: {
            type: "object",
            properties: {
              tweetId: {
                type: "string",
                description: "The ID of the tweet to engage with"
              },
              type: {
                type: "string",
                enum: ["like", "retweet", "reply"],
                description: "The type of engagement"
              },
              replyContent: {
                type: "string",
                description: "The content of the reply (required if type is 'reply')"
              }
            },
            required: ["tweetId", "type"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "analyze_tweet",
          description: "Analyze a tweet's characteristics including sentiment, topics, hooks, style, voice, and engagement potential.",
          parameters: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The tweet content to analyze"
              }
            },
            required: ["content"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "generate_tweet",
          description: "Generate a tweet in the user's authentic writing style based on learned patterns. Use after analyzing their tweet patterns.",
          parameters: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                description: "The topic or theme for the tweet"
              },
              context: {
                type: "string",
                description: "Additional context or specific points to include"
              }
            },
            required: ["topic"]
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "analyze_my_tweet_patterns",
          description: "Analyze the user's historical tweet patterns to learn their writing style, voice, common hooks, and optimal posting times.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function" as const,
        function: {
          name: "get_twitter_analytics",
          description: "Get analytics for a specific Twitter post including impressions, engagements, likes, and retweets.",
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
      },
      {
        type: "function" as const,
        function: {
          name: "check_connection_status",
          description: "Check if the user has connected their Twitter and Reddit accounts.",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ];

    // Create system prompt with user context
    let systemPrompt = `You are Nexa, an AI-powered social media assistant with full access to the user's connected social media accounts. You help users manage their social media presence across platforms like Twitter/X and Reddit.

User Context:
- Business: ${onboardingContext.business_name || 'Not specified'}
- Type: ${onboardingContext.business_type || 'Not specified'}
- Brand Tone: ${onboardingContext.brand_tone || 'Professional'}
- Goals: ${onboardingContext.promotion_goals?.join(', ') || 'Not specified'}
- Posting Frequency: ${onboardingContext.posting_frequency || 'Not specified'}
- Plan: ${userPlan}

You have access to the following capabilities through the user's connected accounts:

**Twitter/X Capabilities:**
1. Post tweets (regular posts, replies, quotes) - Requires connected account
2. Get user's timeline - See what accounts they follow are posting
3. Search through their tweet history - Find past posts on specific topics
4. Engage with tweets - Like, retweet, or reply to build engagement
5. Analyze tweets - Sentiment, topics, hooks, style, voice, engagement potential
6. Generate tweets - Create content in their authentic voice based on learned patterns
7. Analyze tweet patterns - Learn their writing style and optimal posting times
8. Get tweet analytics - View performance metrics for specific tweets

**Reddit Capabilities:**
1. Post to subreddits - Create text or link posts
2. Get subreddit analytics - Track post performance

**Content Strategy:**
- For content creation, match the user's brand tone and business type
- Learn from their historical posts to replicate their authentic voice
- Suggest optimal posting times based on engagement patterns
- Analyze tweet performance to improve future content

**Important Guidelines:**
- Always check if accounts are connected before performing actions
- Each social media action (post, like, retweet, reply) costs 1 credit
- Check credit balance when needed
- When posting, ensure content matches their brand voice and goals
- Provide specific, actionable advice
- Be proactive in suggesting improvements based on analytics
- ABSOLUTELY NO markdown formatting of any kind. 
- NEVER use double asterisks (**) or single asterisks (*) for any reason.
- NEVER use hashtags (#) or dashes (---) for headers or separators.
- Provide all responses in strictly 100% PLAIN TEXT ONLY.
- Write line by line, with a double line break (two newlines) between every single sentence or distinct point.
- If you use a list, use simple numbers (1., 2.) or simple bullets (•) without any markdown symbols.
- Your goal is a perfectly clean, plain text response that looks like a simple list or a series of sentences with spacing.

**Connection Status:**
Before performing any social media action, you can check connection status using check_connection_status. 
If accounts aren't connected, inform the user they need to connect via the dashboard.`;

    // Adjust behavior based on agent mode
    if (agentMode === 'autonomous') {
      systemPrompt += '\n\nAUTONOMOUS MODE: Execute actions immediately when users request them. Take initiative to optimize their social media strategy. Be proactive in suggesting and implementing improvements. After executing an action, provide a clear confirmation with results.';
    } else if (agentMode === 'review') {
      systemPrompt += '\n\nREVIEW MODE: Propose actions for user approval before executing. Always ask for confirmation before performing any social media actions. Explain what you plan to do and why.';
    } else {
      systemPrompt += '\n\nMANUAL MODE: Only execute actions when explicitly requested by the user. Provide guidance and suggestions but wait for user approval. Explain available options clearly.';
    }

    const buildHistoryMessages = async (convId: string): Promise<LLMMessage[]> => {
      const { data: historyData } = await supabaseServer
        .from('messages')
        .select('role, content, metadata')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(10);

      const history: LLMMessage[] = (historyData || []).map(m => ({
        role: m.role as any,
        content: m.content,
        tool_calls: m.metadata?.tool_calls_data,
      }));

      return [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ];
    };

    // Initialize conversation
    let conversationId = requestedConversationId;
    if (!conversationId) {
      const { data: latest } = await supabaseServer
        .from('conversations')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('source', 'web')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      conversationId = latest?.id;
    }

    if (!conversationId) {
      const { data: newConv } = await supabaseServer
        .from('conversations')
        .insert({ user_id: session.user.id, source: 'web' })
        .select('id')
        .single();
      conversationId = newConv?.id;
    }

    const messages = await buildHistoryMessages(conversationId!);

    // Use configured provider to process the message
    let aiResponse = '';
    let toolCalls: any[] | undefined = undefined;
    let totalTokensUsed = 0;

    const { getCreditBalance, recordAIUsage } = await import('@/lib/utils/credits');
    const preBalance = await getCreditBalance(session.user.id);
    if (preBalance <= 0) {
      return NextResponse.json({ error: 'Insufficient credits. Please top up.' }, { status: 402 });
    }

    type LLMMessage = { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_calls?: unknown[] };

    const makeLLMRequest = async (
      messages: LLMMessage[],
      functions?: unknown[],
      toolChoice?: string
    ) => {
      return callUserLLM({
        userId: session.user.id,
        payload: {
          model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          functions,
          tool_choice: toolChoice,
        },
      });
    };

    const scrubMarkdown = (text: string): string => {
      return text
        .replace(/\*\*/g, '') // Remove double asterisks
        .replace(/\*/g, '')   // Remove single asterisks
        .replace(/^#+\s/gm, '') // Remove headers
        .replace(/^---\s*$/gm, '') // Remove horizontal rules
        .trim();
    };

    const completion = await makeLLMRequest(messages, tools, 'auto');
    aiResponse = scrubMarkdown(completion.message);
    toolCalls = completion.tool_calls;
    totalTokensUsed += Number(completion.usage?.total_tokens || 0);

    if (toolCalls && toolCalls.length > 0) {
      const toolResults: LLMMessage[] = [];

      for (const toolCall of toolCalls) {
        try {
          const result = await executeTool(toolCall, session.user.id);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result),
          } as unknown as LLMMessage);
        } catch (error) {
          console.error('Tool execution error:', error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify({ error: error instanceof Error ? error.message : 'Tool execution failed' }),
          } as unknown as LLMMessage);
        }
      }

      const followUpCompletion = await makeLLMRequest(
        [
          ...messages,
          {
            role: 'assistant',
            content: aiResponse,
            tool_calls: toolCalls,
          },
          ...toolResults,
        ],
        undefined,
        undefined
      );

      aiResponse = scrubMarkdown(followUpCompletion.message);
      totalTokensUsed += Number(followUpCompletion.usage?.total_tokens || 0);
    }
    try {
      if (!conversationId) {
        throw new Error('Failed to initialize conversation');
      }

      await supabaseServer
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
          metadata: { timestamp: new Date().toISOString() },
        });

      await supabaseServer
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            timestamp: new Date().toISOString(),
            tool_calls: toolCalls ? toolCalls.length : 0,
            tool_calls_data: toolCalls,
          },
        });
    } catch (dbError) {
      console.error('Error saving conversation:', dbError);
    }

    try {
      if (totalTokensUsed > 0) {
        await recordAIUsage(session.user.id,
          { total_tokens: totalTokensUsed },
          {
            model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
            endpoint: 'agent_chat_api',
          }
        );
      }
    } catch (spendErr) {
      console.error('Credit deduction error:', spendErr);
    }

    // Prepare response data
    const responseData: any = {
      response: aiResponse,
      success: true,
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
