import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEmail } from '@/lib/emailClient';

export async function GET(req: NextRequest) {
  const { data: emails } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending');

  for (const email of emails || []) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', email.user_id)
      .single();

    try {
      await sendEmail(user.email, email.subject, email.body);
      await supabase
        .from('email_queue')
        .update({ status: 'sent' })
        .eq('id', email.id);
    } catch (error) {
      await supabase
        .from('email_queue')
        .update({ status: 'failed' })
        .eq('id', email.id);
    }
  }

  return NextResponse.json({ status: 'Emails sent' });
}
