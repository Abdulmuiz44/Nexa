import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  const { amount } = await req.json();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Get current balance
  const { data: wallet } = await supabase
    .from('credits_wallet')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (!wallet || wallet.balance < amount) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  // Deduct credits
  const { error } = await supabase
    .from('credits_wallet')
    .update({ balance: wallet.balance - amount })
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    tx_type: 'spend',
    credits: amount,
    description: `Chat message deduction`,
  });

  return NextResponse.json({ success: true });
}
