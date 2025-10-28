import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import openai from '@/lib/openaiClient';

export async function POST(req: NextRequest) {
  const { message, conversationId } = await req.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Deduct credits first
  const deductRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/credits/deduct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 5 }),
  });

  if (!deductRes.ok) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  // Get user context
  const { data: user } = await supabase
    .from('users')
    .select('plan, onboarding_data')
    .eq('id', userId)
    .single();

  const context = `User plan: ${user?.plan}, Onboarding: ${JSON.stringify(user?.onboarding_data)}`;

  // Get conversation history
  let conversation;
  if (conversationId) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    conversation = data;
  } else {
    // Create new conversation
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: userId })
      .select()
      .single();
    conversation = data;
  }

  // Save user message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    role: 'user',
    content: message,
  });

  // Call OpenAI
  const messages = [
    { role: 'system', content: `You are Nexa, an AI growth agent. Context: ${context}` },
    { role: 'user', content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
  });

  const aiMessage = response.choices[0].message.content;

  // Save AI message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    role: 'assistant',
    content: aiMessage,
  });

  return NextResponse.json({ message: aiMessage, conversationId: conversation.id });
}
