"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";
import AppSidebar from "@/components/layout/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, ArrowRight, Loader2, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Conversation {
    id: string;
    title: string;
    created_at: string;
    last_message?: string;
}

export default function ChatHistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const userId = (session?.user as any)?.id;
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            if (status !== 'authenticated' || !userId) return;

            try {
                const { data, error } = await supabaseClient
                    .from('conversations')
                    .select(`
            id,
            title,
            created_at,
            messages (
              content,
              created_at
            )
          `)
                    .eq('user_id', userId)
                    .eq('source', 'web')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const formatted = (data || []).map((conv: any) => {
                    const sortedMessages = (conv.messages || []).sort(
                        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    return {
                        id: conv.id,
                        title: conv.title || 'Untitled Chat',
                        created_at: conv.created_at,
                        last_message: sortedMessages[0]?.content || 'No messages yet'
                    };
                });

                setConversations(formatted);
            } catch (err) {
                console.error('Error loading chat history:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (status === 'authenticated') {
            loadHistory();
        } else if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, userId, router]);

    return (
        <div className="min-h-screen bg-background flex">
            <AppSidebar />
            <main className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:hidden">
                    <h1 className="text-lg font-bold">Chat History</h1>
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 overflow-y-auto p-0">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navigation Menu</SheetTitle>
                            </SheetHeader>
                            <AppSidebar onNavigate={() => setMenuOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </header>

                <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Chat History</h1>
                            <p className="text-muted-foreground mt-1">View and manage your previous chat sessions with Nexa.</p>
                        </div>
                        <Button asChild>
                            <Link href="/chat">New Chat</Link>
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Loading your history...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <Card className="border-dashed py-20">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium">No chat history found</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                                    You haven't started any conversations with Nexa yet. Start your first one today!
                                </p>
                                <Button asChild className="mt-6">
                                    <Link href="/chat">Start Chatting</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {conversations.map((conv) => (
                                <Link key={conv.id} href={`/chat/history/${conv.id}`}>
                                    <Card className="hover:border-primary/50 transition-colors group cursor-pointer overflow-hidden border-border/60 bg-card/40 backdrop-blur">
                                        <CardContent className="p-5 flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <MessageSquare className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                                                        {conv.title}
                                                    </h3>
                                                    <div className="flex items-center text-xs text-muted-foreground gap-1.5 flex-shrink-0 ml-2">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(conv.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate italic">
                                                    "{conv.last_message.substring(0, 100)}{conv.last_message.length > 100 ? '...' : ''}"
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
