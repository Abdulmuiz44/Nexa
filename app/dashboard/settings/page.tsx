'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoCampaign: false,
    frequency: 'weekly',
    platforms: [] as string[],
    style: 'growth',
    dailyCreditCap: 100,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('auto_campaigns')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (data) {
      setSettings({
        autoCampaign: data.status === 'active',
        frequency: data.frequency,
        platforms: data.platforms,
        style: data.style,
        dailyCreditCap: data.daily_credit_cap,
      });
    }
  };

  const saveSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + (settings.frequency === 'weekly' ? 7 : 14));

    await supabase.from('auto_campaigns').upsert({
      user_id: session.user.id,
      status: settings.autoCampaign ? 'active' : 'inactive',
      frequency: settings.frequency,
      platforms: settings.platforms,
      style: settings.style,
      daily_credit_cap: settings.dailyCreditCap,
      next_run: nextRun.toISOString(),
    }, { onConflict: 'user_id' });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Settings</h1>
      <div className="mb-4">
        <label>
          <input
            type="checkbox"
            checked={settings.autoCampaign}
            onChange={(e) => setSettings({ ...settings, autoCampaign: e.target.checked })}
          />
          Enable Auto Campaign Mode
        </label>
      </div>
      {settings.autoCampaign && (
        <div>
          <div className="mb-4">
            <label>Frequency</label>
            <select
              value={settings.frequency}
              onChange={(e) => setSettings({ ...settings, frequency: e.target.value })}
              className="border p-2"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
            </select>
          </div>
          <div className="mb-4">
            <label>Platforms</label>
            <div>
              {['twitter', 'reddit'].map((p) => (
                <label key={p}>
                  <input
                    type="checkbox"
                    checked={settings.platforms.includes(p)}
                    onChange={(e) => {
                      const newPlatforms = settings.platforms.includes(p)
                        ? settings.platforms.filter(pl => pl !== p)
                        : [...settings.platforms, p];
                      setSettings({ ...settings, platforms: newPlatforms });
                    }}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label>Style</label>
            <select
              value={settings.style}
              onChange={(e) => setSettings({ ...settings, style: e.target.value })}
              className="border p-2"
            >
              <option value="growth">Growth</option>
              <option value="educational">Educational</option>
              <option value="product">Product</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="mb-4">
            <label>Daily Credit Cap</label>
            <input
              type="number"
              value={settings.dailyCreditCap}
              onChange={(e) => setSettings({ ...settings, dailyCreditCap: Number(e.target.value) })}
              className="border p-2"
            />
          </div>
        </div>
      )}
      <button onClick={saveSettings} className="bg-blue-500 text-white p-2">
        Save Settings
      </button>
    </div>
  );
}
