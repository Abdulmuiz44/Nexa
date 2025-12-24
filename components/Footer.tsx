import Link from "next/link";
import Image from "next/image";


const Footer = () => {
  const productLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Integrations", href: "/integrations" },
    { name: "Case Studies", href: "/case-studies" },
  ];

  const companyLinks = [
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
    { name: "Careers", href: "/about#careers" },
  ];

  const resourcesLinks = [
    { name: "Documentation", href: "/docs" },
    { name: "Help Center", href: "/docs#faq" },
    { name: "Community", href: "https://discord.gg/nexa" },
    { name: "Status", href: "https://status.nexa.ai" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Security", href: "/security" },
    { name: "Cookie Policy", href: "/privacy#cookies" },
  ];

  const socialLinks = [
    { name: "Twitter", href: "https://twitter.com/nexaai", icon: "𝕏" },
    { name: "LinkedIn", href: "https://linkedin.com/company/nexa", icon: "in" },
    { name: "GitHub", href: "https://github.com/nexa-ai", icon: "GH" },
  ];

  return (
    <footer className="border-t border-border bg-secondary/20 py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="relative">
                <div className="relative h-8 w-8">
                  <Image src="/NEXA-LOGO-ONLY.png" alt="Nexa Logo" fill className="object-contain" />
                </div>
                <div className="absolute inset-0 blur-xl bg-primary/30 transition-colors group-hover:bg-accent/30" />
              </div>
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Nexa
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-xs">
              Your 24/7 AI Growth Agent. Automate social media content creation, posting, and engagement across all platforms.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label={social.name}
                >
                  <span className="text-sm font-bold">{social.icon}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Resources</h3>
            <ul className="space-y-3">
              {resourcesLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section Removed */}
      </div>
    </footer>
  );
};

export default Footer;