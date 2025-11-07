"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ArrowLeft, MessageSquare, Bot, BarChart3, FileText, Activity, Link as LinkIcon, CreditCard, Settings, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabaseClient } from "@/lib/supabaseClient";

// Load ChatUI on the client only to avoid SSR preloading issues with chunks during HMR
const ChatUIClient = dynamic(() => import("@/components/ChatUI"), {
  ssr: false,
  loading: () => (
    <div className="p-6 text-center text-muted-foreground">Loading chat...</div>
  ),
});
const chatNav = [
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Dashboard", href: "/dashboard", icon: Bot },
  { title: "Campaigns", href: "/dashboard/campaigns", icon: Bot },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Scheduled", href: "/dashboard/scheduled", icon: CalendarIcon },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "Logs", href: "/dashboard/logs", icon: Activity },
  { title: "Connections", href: "/dashboard/connections", icon: LinkIcon },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const userId = (session?.user as any)?.id;
  const [busy, setBusy] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [redditConnected, setRedditConnected] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

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

  // Load scheduled pending count for badge
  useEffect(() => {
    let abort = false;
    const loadCount = async () => {
      if (!userId) return;
      try {
        const nowIso = new Date().toISOString();
        const res = await fetch(`/api/posts/scheduled?status=pending&from=${encodeURIComponent(nowIso)}&countOnly=1`, { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (!abort) setScheduledCount(Number(data?.count || 0));
      } catch {}
    };
    loadCount();
    const timer = setInterval(loadCount, 60_000);
    return () => { abort = true; clearInterval(timer); };
  }, [userId]);

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
      setConversations(data || []);
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

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full w-64 flex-col bg-card/60 backdrop-blur-sm border-r border-border text-white">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold">Nexa</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {chatNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent/50 ${
                  isActive ? "bg-accent text-white" : "text-white/80 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.title}</span>
                {item.title === 'Scheduled' && scheduledCount > 0 && (
                  <Badge className="ml-auto h-5 px-2 text-xs">{scheduledCount}</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 px-4">
          <div className="text-xs uppercase tracking-wide text-white/60 mb-2">History</div>
          <div className="space-y-1">
            {conversations.length === 0 && (
              <div className="text-white/60 text-sm px-3 py-2">No conversations yet</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedConversationId(c.id); onNavigate?.(); }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedConversationId === c.id ? 'bg-accent text-white' : 'text-white/80 hover:text-white hover:bg-accent/30'
                }`}
              >
                {new Date(c.created_at).toISOString().replace('T', ' ').slice(0, 16) + 'Z'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} alt={session?.user?.name || ''} />
            <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">{session?.user?.name}</div>
            <div className="truncate text-xs text-white/60">{session?.user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );

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
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        <Sidebar />
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
