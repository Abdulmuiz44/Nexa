import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/lib/supabaseClient';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const from = body.get('From') as string;
  const bodyText = body.get('Body') as string;

  // Extract phone
  const phone = from.replace('whatsapp:', '');

  // Find user
  const { data: user } = await supabase
    .from('users')
    .select('id, phone')
    .eq('phone', phone)
    .single();

  if (!user) {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: from,
      body: 'Please register your WhatsApp first at https://nexa-agent.vercel.app/dashboard/connections',
    });
    return NextResponse.json({ status: 'ok' });
  }

  // Get or create conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('source', 'whatsapp')
    .single();

  if (!conversation) {
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, source: 'whatsapp' })
      .select()
      .single();
    conversation = data;
  }

  // Save user message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    role: 'user',
    content: bodyText,
    metadata: { source: 'whatsapp' },
  });

  // Check credits
  const { data: wallet } = await supabase
    .from('credits_wallet')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.balance < 5) {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: from,
      body: '⚠️ You’re out of credits. Top up at your Nexa dashboard: https://nexa-agent.vercel.app/dashboard/billing',
    });
    return NextResponse.json({ status: 'ok' });
  }

  // Deduct credits
  await supabase
    .from('credits_wallet')
    .update({ balance: wallet.balance - 5 })
    .eq('user_id', user.id);

  // Call chat API
  const chatRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: bodyText, conversationId: conversation.id }),
  });

  const chatData = await chatRes.json();
  const aiMessage = chatData.message;

  // Send reply
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: from,
    body: aiMessage,
  });

  // Save AI message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    role: 'assistant',
    content: aiMessage,
    metadata: { source: 'whatsapp' },
  });

  // Notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'whatsapp_message',
    message: 'New message via WhatsApp',
    read: false,
  });

  return NextResponse.json({ status: 'ok' });
}
