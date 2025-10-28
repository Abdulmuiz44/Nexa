'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

interface User {
  name: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', session.user.id)
          .single();
        setUser(userData);

        const { data: creditData, error: creditError } = await supabase
          .from('credits_wallet')
          .select('balance')
          .eq('user_id', session.user.id)
          .single();
        if (creditError) {
          toast({
            title: "Error Loading Credits",
            description: creditError.message,
            variant: "destructive",
          });
        } else {
          setCredits(creditData?.balance || 0);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome to Nexa Dashboard, {user?.name || 'User'} 👋</h1>
      <p className="mb-4">Credits: {credits}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Chat</h2>
          <p>Start a conversation with Nexa AI.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Campaigns</h2>
          <p>Manage your growth campaigns.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p>View your performance metrics.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Connections</h2>
          <p>Connect your social accounts.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Billing</h2>
          <p>Manage your subscription.</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Settings</h2>
          <p>Configure your preferences.</p>
        </div>
      </div>
    </div>
  );
}
