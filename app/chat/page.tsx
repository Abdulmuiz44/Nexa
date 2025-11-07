"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, ArrowLeft } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import AppSidebar from "@/components/layout/AppSidebar";

// Load ChatUI on the client only to avoid SSR preloading issues with chunks during HMR
const ChatUIClient = dynamic(() => import("@/components/ChatUI"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-muted-foreground">Loading chat...</div>
  ),
});

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id;
  const [busy, setBusy] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [redditConnected, setRedditConnected] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const loadConnections = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/connectors`, { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const conns = Array.isArray(data?.connections) ? data.connections : [];
        setTwitterConnected(conns.some((c: any) => String(c.toolkit_slug || '').includes('twitter')));
        setRedditConnected(conns.some((c: any) => String(c.toolkit_slug || '').includes('reddit')));
      } catch {}
    };
    loadConnections();
    return () => { mounted = false };
  }, [userId]);

  // Preselect most recent conversation for Chat UI
  useEffect(() => {
    const loadConversations = async () => {
      if (status !== 'authenticated' || !userId) return;
      if (!supabaseClient) return;
      const { data } = await supabaseClient
        .from('conversations')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('source', 'web')
        .order('created_at', { ascending: false });
      if (!selectedConversationId && data && data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
    };
    loadConversations();
  }, [status, userId]);

  const connectToolkit = async (toolkit: string) => {
    if (!userId) return;
    setBusy(true);
    try {
      const start = await fetch('/api/composio/start-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit }),
      }).then(r => r.json());

      await fetch('/api/composio/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: start.sessionId, userId, toolkit }),
      });

      if (toolkit === 'twitter') setTwitterConnected(true);
      if (toolkit === 'reddit') setRedditConnected(true);
    } catch (e) {
      console.error('Connect failed', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          {!twitterConnected && (
            <Button variant="outline" size="sm" disabled={busy || status !== 'authenticated'} onClick={() => connectToolkit('twitter')}>
              Connect Twitter
            </Button>
          )}
          {!redditConnected && (
            <Button variant="outline" size="sm" disabled={busy || status !== 'authenticated'} onClick={() => connectToolkit('reddit')}>
              Connect Reddit
            </Button>
          )}
        </div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 overflow-y-auto p-0">
            <AppSidebar onNavigate={() => setMenuOpen(false)} onSelectConversation={setSelectedConversationId} selectedConversationId={selectedConversationId} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        <AppSidebar onSelectConversation={setSelectedConversationId} selectedConversationId={selectedConversationId} />
        <main className="flex-1">
          <div className="border-b border-border bg-background/80 p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Nexa Chat</div>
              <div className="flex items-center gap-2">
                {!twitterConnected && (
                  <Button variant="outline" size="sm" disabled={busy || status !== 'authenticated'} onClick={() => connectToolkit('twitter')}>
                    Connect Twitter
                  </Button>
                )}
                {!redditConnected && (
                  <Button variant="outline" size="sm" disabled={busy || status !== 'authenticated'} onClick={() => connectToolkit('reddit')}>
                    Connect Reddit
                  </Button>
                )}
                <Button asChild size="sm">
                  <Link href="/dashboard">Open Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
          <ChatUIClient conversationId={selectedConversationId} />
        </main>
      </div>

      {/* Mobile Chat Content */}
      <div className="md:hidden">
        <ChatUIClient conversationId={selectedConversationId} />
      </div>
    </div>
  );
}
