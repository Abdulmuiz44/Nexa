"use client";

import { Button } from "@/components/ui/button";
import { Zap, Menu, X } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Zap className="h-8 w-8 text-primary group-hover:text-accent transition-colors" />
            <div className="absolute inset-0 blur-xl bg-primary/30 group-hover:bg-accent/30 transition-colors" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nexa
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
        <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
        Features
        </Link>
        <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
          How It Works
        </Link>
        <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
        Pricing
        </Link>
        <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
        Docs
        </Link>
        {status === "authenticated" && (
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
        )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        <div className="flex items-center gap-4">
        {status === "authenticated" ? (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center gap-2 rounded-full px-3">
        <Zap className="h-4 w-4 text-primary" />
        <Avatar className="h-6 w-6">
        <AvatarImage src={session.user?.image || "/placeholder-user.jpg"} alt={session.user?.name || ""} />
          <AvatarFallback>{session.user?.name?.[0]}</AvatarFallback>
          </Avatar>
          </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="container mx-auto px-6 py-4 space-y-4">
          <Link
          href="#features"
          className="block text-muted-foreground hover:text-foreground transition-colors py-2"
          onClick={() => setMobileMenuOpen(false)}
          >
          Features
          </Link>
            <Link
              href="#how-it-works"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
            href="/pricing"
            className="block text-muted-foreground hover:text-foreground transition-colors py-2"
            onClick={() => setMobileMenuOpen(false)}
            >
            Pricing
            </Link>
            <Link
              href="/docs"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            {status === "authenticated" && (
              <Link
                href="/dashboard"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
                Dashboard
            </Link>
            )}
            <div className="pt-4 border-t border-border">
              {status === "authenticated" ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  Log out
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button variant="hero" asChild className="w-full">
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;