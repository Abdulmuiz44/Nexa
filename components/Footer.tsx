import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
        <div className="text-center md:text-left mb-6 md:mb-0">
          <Link href="/" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Nexa
          </Link>
          <p className="text-muted-foreground mt-2">Autonomous AI Growth Agent</p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Nexa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;