import { supabase } from '@/lib/supabaseClient';

export async function buildStrategyPrompt(userId: string): Promise<string> {
  const { data } = await supabase
    .from('analytics_daily_summary')
    .select('top_performing_style')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  const styles = data?.map(d => d.top_performing_style).filter(Boolean) || [];
  const preferred = styles.length > 0 ? styles[0] : 'growth';

  return `User prefers ${preferred} style posts. Adapt future content accordingly.`;
}
