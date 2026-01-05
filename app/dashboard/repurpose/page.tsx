'use client';

import { useSession } from 'next-auth/react';
import { ContentRepurposing } from '@/components/ContentRepurposing';

export default function RepurposePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Content Repurposing</h1>
          <p className="text-muted-foreground mt-2">
            Transform your blog posts, videos, and articles into optimized social media content
          </p>
        </div>

        {userId && <ContentRepurposing userId={userId} />}
      </div>
    </div>
  );
}
