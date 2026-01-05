'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Default to dark mode
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nexa</h1>
          <div className="flex gap-6 items-center">
            <Link href="#features" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              Docs
            </Link>
            <Link href="/auth/signin" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-bold mb-6">
            AI Agent for Marketing & Content
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Automate social media posts, engage with communities, and grow your audience 24/7.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900" asChild>
              <Link href="/docs">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-3">AI Content Generation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate brand-aligned posts and tweets in seconds. Learns from your best-performing content.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-3">Brand Safety</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Set custom approval workflows and guidelines. Every post checked before publishing.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-3">Always-On Engagement</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Post, reply, and engage 24/7 across Reddit, X, and LinkedIn.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-3">Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track engagement, growth, and performance across all platforms.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-3">Multi-Platform</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage Twitter, Reddit, LinkedIn, and more from one dashboard.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-3">API Access</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Full API access for custom integrations and workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-2xl font-semibold mb-2">Starter</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">For solo founders</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-600 dark:text-gray-400">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-400">
                <li>✓ Core AI content generation</li>
                <li>✓ Basic analytics</li>
                <li>✓ Single platform integration</li>
                <li>✓ Community engagement tools</li>
              </ul>
              <Button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>

            {/* Growth */}
            <div className="p-8 border-2 border-black dark:border-white rounded-lg">
              <div className="mb-4 inline-block bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-sm rounded">
                Most Popular
              </div>
              <h3 className="text-2xl font-semibold mb-2">Growth</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">For startups & agencies</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-gray-600 dark:text-gray-400">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-400">
                <li>✓ Everything in Starter</li>
                <li>✓ Multi-agent automation</li>
                <li>✓ Cross-platform posting</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <Button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>

            {/* Scale */}
            <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-2xl font-semibold mb-2">Scale</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">For enterprises</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-gray-600 dark:text-gray-400">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-400">
                <li>✓ Everything in Growth</li>
                <li>✓ Dedicated instance</li>
                <li>✓ White-label options</li>
                <li>✓ Full API access</li>
              </ul>
              <Button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12 text-center">FAQ</h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-lg font-semibold mb-3">How long does setup take?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You can launch your first agent in under 10 minutes. Connect your social accounts and start creating content immediately.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-lg font-semibold mb-3">Can I cancel anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, no long-term contracts. Cancel your subscription at any time from your account settings.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-lg font-semibold mb-3">Do you offer custom plans?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, we offer custom pricing for enterprise customers. Contact our sales team for more information.
              </p>
            </div>
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-lg font-semibold mb-3">What platforms are supported?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We currently support Twitter, Reddit, LinkedIn, and more platforms coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Launch your AI agent in under 10 minutes. No credit card required.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900" asChild>
              <Link href="mailto:sales@example.com">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Nexa</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">AI agent for marketing and content creation.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="#features" className="hover:text-black dark:hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-black dark:hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-black dark:hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-black dark:hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-black dark:hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-black dark:hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="/privacy" className="hover:text-black dark:hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-black dark:hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">&copy; 2025 Nexa. All rights reserved.</p>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
