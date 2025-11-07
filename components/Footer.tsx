import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border py-10 sm:py-12">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:gap-4 sm:px-6 sm:text-left">
        <div>
          <Link href="/" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nexa
          </Link>
          <p className="text-muted-foreground mt-2">Autonomous AI Growth Agent</p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Link href="/pricing" className="transition-colors text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/dashboard" className="transition-colors text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Nexa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;