import { supabase } from '@/lib/supabaseClient';

export interface Forecast {
  avg_daily_usage: number;
  days_left: number;
  forecast_date: string;
  risk_level: 'low' | 'medium' | 'high';
}

export async function calculateForecast(userId: string): Promise<Forecast> {
  // Get recent transactions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('credits, created_at')
    .eq('user_id', userId)
    .eq('tx_type', 'spend')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (!transactions || transactions.length === 0) {
    return { avg_daily_usage: 0, days_left: Infinity, forecast_date: '', risk_level: 'low' };
  }

  // Calculate daily usage
  const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.credits), 0);
  const days = 30;
  const avg_daily_usage = totalSpent / days;

  // Current balance
  const { data: wallet } = await supabase
    .from('credits_wallet')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const balance = wallet?.balance || 0;

  const days_left = avg_daily_usage > 0 ? balance / avg_daily_usage : Infinity;
  const forecast_date = new Date();
  forecast_date.setDate(forecast_date.getDate() + days_left);

  let risk_level: 'low' | 'medium' | 'high' = 'low';
  if (days_left <= 2) risk_level = 'high';
  else if (days_left <= 7) risk_level = 'medium';

  return {
    avg_daily_usage: Math.round(avg_daily_usage * 100) / 100,
    days_left: Math.round(days_left * 100) / 100,
    forecast_date: forecast_date.toISOString().split('T')[0],
    risk_level,
  };
}
