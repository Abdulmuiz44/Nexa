'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({
    revenue: 0,
    subscribers: 0,
    creditsSold: 0,
    forecasts: [],
    summary: [],
    insight: '',
    reports: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Check if admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (user?.is_admin) {
      // Admin view
      const { data: rev } = await supabase
        .from('revenue_tracking')
        .select('total_revenue')
        .order('date', { ascending: false })
        .limit(1);

      const { data: sub } = await supabase
        .from('subscription_analytics')
        .select('subscribers_count')
        .order('date', { ascending: false })
        .limit(1);

      const { data: forecasts } = await supabase
        .from('users')
        .select('id, credit_forecast, auto_top_up');

      setData({
        revenue: rev?.[0]?.total_revenue || 0,
        subscribers: sub?.[0]?.subscribers_count || 0,
        creditsSold: 0,
        forecasts: forecasts || [],
      });
    } else {
      // User view: fetch personal analytics
      const { data: summary } = await supabase
        .from('analytics_daily_summary')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);

      const { data: insight } = await supabase
        .from('analytics_insights')
        .select('insight')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      setData({
        summary: summary || [],
        insight: insight?.[0]?.insight || '',
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Analytics</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="border p-4">
          <h2>Total Revenue</h2>
          <p>${data.revenue}</p>
        </div>
        <div className="border p-4">
          <h2>Active Subscribers</h2>
          <p>{data.subscribers}</p>
        </div>
        <div className="border p-4">
          <h2>Credits Sold</h2>
          <p>{data.creditsSold}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl mb-2">Credit Forecasting</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Avg Usage</th>
              <th>Forecast Date</th>
              <th>Risk</th>
              <th>Auto Top-Up</th>
            </tr>
          </thead>
          <tbody>
            {data.forecasts.map((f: any) => (
              <tr key={f.id}>
                <td>{f.id}</td>
                <td>{f.credit_forecast?.avg_daily_usage || 0}</td>
                <td>{f.credit_forecast?.forecast_date || ''}</td>
                <td>{f.credit_forecast?.risk_level || ''}</td>
                <td>{f.auto_top_up ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
