"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleNavClick = () => setMobileMenuOpen(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8">
            <Image src="/NEXA-LOGO-ONLY.png" alt="Nexa Logo" fill className="object-contain" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nexa
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className={`text-muted-foreground transition-colors hover:text-foreground ${isActive('/#features') ? 'text-foreground' : ''}`}
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className={`text-muted-foreground transition-colors hover:text-foreground ${isActive('/#how-it-works') ? 'text-foreground' : ''}`}
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className={`text-muted-foreground transition-colors hover:text-foreground ${isActive('/pricing') ? 'text-foreground' : ''}`}
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className={`text-muted-foreground transition-colors hover:text-foreground ${isActive('/docs') ? 'text-foreground' : ''}`}
          >
            Docs
          </Link>
          {status === "authenticated" && (
            <Link
              href="/dashboard"
              className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/dashboard') ? 'text-foreground' : ''}`}
            >
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

        <div className="hidden items-center gap-2 sm:gap-4 md:flex">
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 rounded-full px-3">
                  <div className="relative h-4 w-4">
                    <Image src="/NEXA-LOGO-ONLY.png" alt="Nexa" fill className="object-contain" />
                  </div>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
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
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="container mx-auto space-y-4 px-4 py-4 sm:px-6">
            <Link
              href="/#features"
              className="block rounded-lg px-2 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              onClick={handleNavClick}
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="block rounded-lg px-2 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              onClick={handleNavClick}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="block rounded-lg px-2 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              onClick={handleNavClick}
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="block rounded-lg px-2 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              onClick={handleNavClick}
            >
              Docs
            </Link>
            {status === "authenticated" && (
              <Link
                href="/dashboard"
                className="block rounded-lg px-2 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                onClick={handleNavClick}
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
                    <Link href="/auth/login" onClick={handleNavClick}>Sign In</Link>
                  </Button>
                  <Button variant="hero" asChild className="w-full">
                    <Link href="/auth/signup" onClick={handleNavClick}>Get Started</Link>
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