import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/lib/supabaseClient';
import composio from '@/lib/composioClient';
import { sendEmail } from '@/lib/emailClient';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function GET(req: NextRequest) {
  const { data: users } = await supabase.from('users').select('id, phone');

  for (const user of users || []) {
    // Get latest report
    const { data: report } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('week_end', { ascending: false })
      .limit(1)
      .single();

    if (!report) continue;

    const digest = `📈 Your Weekly Nexa Report:\n• ${report.roi_summary}\n• ${report.insights}\n• ${report.recommendations}`;

    let sent = false;

    // Try WhatsApp
    if (user.phone) {
      try {
        await twilioClient.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${user.phone}`,
          body: digest,
        });
        await logDigest(user.id, report.id, 'whatsapp');
        sent = true;
      } catch (error) {
        console.error('WhatsApp send failed:', error);
      }
    }

    // Try X DM
    if (!sent) {
      const { data: connections } = await supabase
        .from('connected_accounts')
        .select('composio_connection_id')
        .eq('user_id', user.id)
        .eq('platform', 'twitter');

      if (connections?.length) {
        try {
          await composio.actions.execute({
            actionId: 'send_dm',
            connectionId: connections[0].composio_connection_id,
            params: { message: digest },
          });
          await logDigest(user.id, report.id, 'twitter');
          sent = true;
        } catch (error) {
          console.error('X DM send failed:', error);
        }
      }
    }

    // Fallback to email
    if (!sent) {
      const { data: userData } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', user.id)
        .single();

      try {
        await sendEmail(userData.email, 'Your Weekly Nexa Digest', `<p>${digest.replace(/\n/g, '<br>')}</p>`);
        await logDigest(user.id, report.id, 'email');
      } catch (error) {
        console.error('Email send failed:', error);
      }
    }

    // Notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'weekly_digest',
      message: 'Your weekly digest has been sent!',
      read: false,
    });
  }

  return NextResponse.json({ status: 'Digests sent' });
}

async function logDigest(userId: string, reportId: string, sentVia: string) {
  await supabase.from('weekly_digest_log').insert({
    user_id: userId,
    sent_via: sentVia,
    report_id: reportId,
  });
}
