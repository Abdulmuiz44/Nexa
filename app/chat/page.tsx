"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function ChatEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    const initializeNewChat = async () => {
      if (status !== 'authenticated' || !userId || !supabaseClient) return;

      try {
        // Create a new conversation session via API to bypass client-side RLS issues
        const response = await fetch('/api/chat/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Chat', source: 'web' })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create session');
        }

        const { session: newConv } = await response.json();
        if (newConv && newConv.id) {
          router.replace(`/chat/${newConv.id}`);
        }
      } catch (err) {
        console.error('Failed to initialize chat session:', err);
      }
    };

    if (status === 'authenticated') {
      initializeNewChat();
    } else if (status === 'unauthenticated') {
      router.replace('/auth/login');
    }
  }, [status, userId, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Initializing new chat session...</p>
      </div>
    </div>
  );
}
