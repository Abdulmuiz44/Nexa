import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { calculateForecast } from '@/lib/utils/creditForecast';

export async function GET(req: NextRequest) {
  // Get all users
  const { data: users } = await supabase.from('users').select('id');

  for (const user of users || []) {
    const forecast = await calculateForecast(user.id);

    // Update user credit_forecast
    await supabase
      .from('users')
      .update({ credit_forecast: forecast })
      .eq('id', user.id);

    // If high risk, create notification
    if (forecast.risk_level === 'high') {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'credit_alert',
        message: `You're running low on credits. Estimated depletion in ${forecast.days_left} days.`,
        read: false,
      });
    }

    // Check auto top-up
    const { data: u } = await supabase
      .from('users')
      .select('auto_top_up')
      .eq('id', user.id)
      .single();

    if (u?.auto_top_up && forecast.days_left <= 2) {
      // Trigger auto top-up
      await autoTopUp(user.id);
    }
  }

  return NextResponse.json({ status: 'Forecasts updated' });
}

async function autoTopUp(userId: string) {
  // Assume preset $10 for 1000 credits
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/credits/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1000 }),
  });

  if (res.ok) {
    const data = await res.json();
    // For auto, perhaps use saved card, but for now, assume redirects or handles
    // In production, use Flutterwave's saved card API
  }
}
