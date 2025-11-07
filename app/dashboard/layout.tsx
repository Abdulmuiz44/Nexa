"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bot,
  BarChart3,
  Settings,
  CreditCard,
  Link as LinkIcon,
  Menu,
  MessageSquare,
  Zap,
  LogOut,
  User,
  FileText,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const sidebarItems = [
  {
    title: "Chat",
    href: "/dashboard",
    icon: MessageSquare,
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Bot,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Logs",
    href: "/dashboard/logs",
    icon: Activity,
  },
  {
    title: "Connections",
    href: "/dashboard/connections",
    icon: LinkIcon,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card/50 backdrop-blur-sm border-r border-border">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Zap className="h-6 w-6 text-primary group-hover:text-accent transition-colors" />
            <div className="absolute inset-0 blur-xl bg-primary/30 group-hover:bg-accent/30 transition-colors" />
          </div>
          <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nexa
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent/50 hover:text-foreground ${
                  isActive ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function DashboardHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 overflow-y-auto p-0">
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative flex items-center gap-2 rounded-full px-2 sm:px-3">
            <Avatar className="h-9 w-9 sm:h-8 sm:w-8">
              <AvatarImage src={session?.user?.image || "/placeholder-user.jpg"} alt={session?.user?.name || ""} />
              <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default function DashboardLayout({
children,
}: {
children: React.ReactNode;
}) {
const { data: session, status } = useSession();

console.log('DashboardLayout: session status:', status, 'session:', session);

if (status === "loading") {
return (
<div className="min-h-screen flex items-center justify-center bg-background">
<div className="text-center">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
    <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
    </div>
    );
}

if (!session) {
console.log('DashboardLayout: No session, redirecting to login');
return (
<div className="min-h-screen flex items-center justify-center bg-background">
<div className="text-center">
    <p className="text-muted-foreground mb-4">You need to be logged in to access this page.</p>
      <Button onClick={() => window.location.href = "/auth/login"}>Go to Login</Button>
      </div>
      </div>
    );
  }

  console.log('DashboardLayout: Session found, rendering dashboard');

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:flex">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex min-h-screen flex-col md:hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
