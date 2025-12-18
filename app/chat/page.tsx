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
      if (status !== 'authenticated' || !userId) return;

      try {
        // Create a new conversation session
        const { data: newConv, error } = await supabaseClient
          .from('conversations')
          .insert({
            user_id: userId,
            source: 'web',
            title: 'New Chat'
          })
          .select('id')
          .single();

        if (error) throw error;
        if (newConv) {
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
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing new chat session...</p>
      </div>
    </div>
  );
}
