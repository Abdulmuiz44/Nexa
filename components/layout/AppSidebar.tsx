"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  BarChart3,
  FileText,
  Activity,
  Link as LinkIcon,
  CreditCard,
  Settings,
  Calendar as CalendarIcon,
  CheckCircle,
  Recycle,
  TrendingUp,
  Users,
  FlaskConical,
  Bell,
  Database,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Campaigns", href: "/dashboard/campaigns", icon: MessageSquare },
  { title: "Approvals", href: "/dashboard/approvals", icon: CheckCircle },
  { title: "Repurpose", href: "/dashboard/repurpose", icon: Recycle },
  { title: "Engage", href: "/dashboard/engage", icon: Users },
  { title: "Experiments", href: "/dashboard/experiments", icon: FlaskConical },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Performance", href: "/dashboard/performance", icon: TrendingUp },
  { title: "Scheduled", href: "/dashboard/scheduled", icon: CalendarIcon },
  { title: "Content Hub", href: "/dashboard/content-hub", icon: Database },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "Logs", href: "/dashboard/logs", icon: Activity },
  { title: "Connections", href: "/dashboard/connections", icon: LinkIcon },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface AppSidebarProps {
  onNavigate?: () => void;
  onSelectConversation?: (id: string) => void;
  selectedConversationId?: string;
}

export default function AppSidebar({ onNavigate, onSelectConversation, selectedConversationId }: AppSidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const userId = (session?.user as any)?.id;

  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);

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
      } catch { }
    };
    loadCount();
    const timer = setInterval(loadCount, 60_000);
    return () => { abort = true; clearInterval(timer); };
  }, [userId]);

  // Load conversations for history
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
    };
    loadConversations();
  }, [status, userId]);

  // Load notification count for badge
  useEffect(() => {
    let abort = false;
    const loadNotificationCount = async () => {
      if (!userId) return;
      try {
        const res = await fetch('/api/notifications/count', { method: 'GET' });
        if (!res.ok) return;
        const data = await res.json();
        if (!abort) setNotificationCount(Number(data?.count || 0));
      } catch { }
    };
    loadNotificationCount();
    const timer = setInterval(loadNotificationCount, 30_000); // Check every 30 seconds
    return () => { abort = true; clearInterval(timer); };
  }, [userId]);

  return (
    <div className="sticky top-0 h-[100dvh] flex w-64 flex-col bg-card/60 backdrop-blur-sm border-r border-border text-white">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <img src="/NEXA-LOGO-ONLY.png" alt="Nexa Logo" className="object-contain w-full h-full" />
          </div>
          <span className="text-lg font-bold">Nexa</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon as any;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent/50 ${isActive ? "bg-accent text-white" : "text-white/80 hover:text-white"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.title}</span>
                {item.title === 'Scheduled' && scheduledCount > 0 && (
                  <Badge className="ml-auto h-5 px-2 text-xs">{scheduledCount}</Badge>
                )}
                {item.title === 'Notifications' && notificationCount > 0 && (
                  <Badge className="ml-auto h-5 px-2 text-xs bg-red-500">{notificationCount}</Badge>
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
                onClick={() => { onSelectConversation?.(c.id); onNavigate?.(); }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${selectedConversationId === c.id ? 'bg-accent text-white' : 'text-white/80 hover:text-white hover:bg-accent/30'
                  }`}
              >
                {new Date(c.created_at).toISOString().replace('T', ' ').slice(0, 16) + 'Z'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div
          className="flex items-center gap-3"
          onMouseEnter={() => setProfileMenuOpen(true)}
          onMouseLeave={() => setProfileMenuOpen(false)}
        >
          <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md p-1 hover:bg-accent/40 focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ''} />
                  <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <div className="truncate text-sm font-medium text-white">{session?.user?.name}</div>
                  <div className="truncate text-xs text-white/60">{session?.user?.email}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing">Billing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/docs">Docs</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/login" })}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
