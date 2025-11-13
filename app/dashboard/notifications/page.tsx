'use client';

import { useSession } from 'next-auth/react';
import { Notifications } from '@/components/Notifications';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with your campaign performance and important alerts
          </p>
        </div>

        {userId && <Notifications userId={userId} />}
      </div>
    </div>
  );
}
