'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('auto_campaigns')
      .select('*')
      .eq('user_id', session.user.id);

    setCampaigns(data || []);
  };

  const runNow = async (campaignId: string) => {
    // Trigger manual run
    alert('Manual run triggered');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Campaigns</h1>
      <div>
        {campaigns.map((c: any) => (
          <div key={c.id} className="border p-4 mb-4">
            <p>Status: {c.status}</p>
            <p>Platforms: {c.platforms.join(', ')}</p>
            <p>Style: {c.style}</p>
            <p>Next Run: {c.next_run}</p>
            <button onClick={() => runNow(c.id)} className="bg-blue-500 text-white p-2">
              Run Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
