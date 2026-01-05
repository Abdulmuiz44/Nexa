'use client';

import { useSession } from 'next-auth/react';
import { ABTesting } from '@/components/ABTesting';

export default function ExperimentsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">A/B Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test different content variations to optimize your social media performance
          </p>
        </div>

        {userId && <ABTesting userId={userId} />}
      </div>
    </div>
  );
}
