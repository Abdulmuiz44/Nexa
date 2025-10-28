'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardHeader() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    setNotifications(data || []);
  };

  return (
    <div className="bg-gray-100 p-4 flex justify-between">
      <h1>Nexa Dashboard</h1>
      <div>
        🔔 {notifications.length} unread
        {notifications.length > 0 && (
          <div className="absolute right-0 mt-2 bg-white border p-2">
            {notifications.map((n: any) => (
              <p key={n.id}>{n.message}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
