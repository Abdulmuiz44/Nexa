"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Menu, ArrowLeft, History } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";

// Load ChatUI on the client only to avoid SSR preloading issues
const ChatUIClient = dynamic(() => import("@/components/ChatUI"), {
    ssr: false,
    loading: () => (
        <div className="p-6 text-center text-muted-foreground">Loading chat...</div>
    ),
});

export default function ChatHistorySessionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const conversationId = params.id as string;
    const userId = (session?.user as any)?.id;
    const [busy, setBusy] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:hidden">
                <Button variant="ghost" size="icon" onClick={() => router.push('/chat/history')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2 text-sm font-medium">
                    <History className="h-4 w-4" />
                    Chat Session
                </div>
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
                        <AppSidebar onNavigate={() => setMenuOpen(false)} selectedConversationId={conversationId} />
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop Layout */}
            <div className="hidden md:flex">
                <AppSidebar selectedConversationId={conversationId} />
                <main className="flex-1">
                    <div className="border-b border-border bg-background/80 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                                <History className="h-5 w-5" />
                                History Session
                            </div>
                            <div className="flex items-center gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/chat/history">Back to History</Link>
                                </Button>
                                <Button asChild size="sm" variant="ghost">
                                    <Link href="/chat">New Chat</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href="/dashboard">Dashboard</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <ChatUIClient conversationId={conversationId} />
                </main>
            </div>

            {/* Mobile Chat Content */}
            <div className="md:hidden">
                <ChatUIClient conversationId={conversationId} />
            </div>
        </div>
    );
}
