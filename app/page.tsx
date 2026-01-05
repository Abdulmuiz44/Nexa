import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nexa</h1>
          <div className="flex gap-6">
            <Link href="#features" className="text-gray-600 hover:text-black">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-black">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-black">
              Docs
            </Link>
            <Link href="/auth/signin" className="text-gray-600 hover:text-black">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-gray-200 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-bold mb-6">
            AI Agent for Marketing & Content
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Automate social media posts, engage with communities, and grow your audience 24/7.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-gray-200 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">AI Content Generation</h3>
              <p className="text-gray-600">
                Generate brand-aligned posts and tweets in seconds. Learns from your best-performing content.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Brand Safety</h3>
              <p className="text-gray-600">
                Set custom approval workflows and guidelines. Every post checked before publishing.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Always-On Engagement</h3>
              <p className="text-gray-600">
                Post, reply, and engage 24/7 across Reddit, X, and LinkedIn.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Analytics</h3>
              <p className="text-gray-600">
                Track engagement, growth, and performance across all platforms.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Multi-Platform</h3>
              <p className="text-gray-600">
                Manage Twitter, Reddit, LinkedIn, and more from one dashboard.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">API Access</h3>
              <p className="text-gray-600">
                Full API access for custom integrations and workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-gray-200 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold mb-12 text-center">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-8 border border-gray-200 rounded-lg">
              <h3 className="text-2xl font-semibold mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">For solo founders</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-600">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li>✓ Core AI content generation</li>
                <li>✓ Basic analytics</li>
                <li>✓ Single platform integration</li>
                <li>✓ Community engagement tools</li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>

            {/* Growth */}
            <div className="p-8 border-2 border-black rounded-lg">
              <div className="mb-4 inline-block bg-black text-white px-3 py-1 text-sm rounded">
                Most Popular
              </div>
              <h3 className="text-2xl font-semibold mb-2">Growth</h3>
              <p className="text-gray-600 mb-6">For startups & agencies</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-gray-600">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li>✓ Everything in Starter</li>
                <li>✓ Multi-agent automation</li>
                <li>✓ Cross-platform posting</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>

            {/* Scale */}
            <div className="p-8 border border-gray-200 rounded-lg">
              <h3 className="text-2xl font-semibold mb-2">Scale</h3>
              <p className="text-gray-600 mb-6">For enterprises</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-gray-600">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li>✓ Everything in Growth</li>
                <li>✓ Dedicated instance</li>
                <li>✓ White-label options</li>
                <li>✓ Full API access</li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-gray-200 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12 text-center">FAQ</h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">How long does setup take?</h3>
              <p className="text-gray-600">
                You can launch your first agent in under 10 minutes. Connect your social accounts and start creating content immediately.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes, no long-term contracts. Cancel your subscription at any time from your account settings.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Do you offer custom plans?</h3>
              <p className="text-gray-600">
                Yes, we offer custom pricing for enterprise customers. Contact our sales team for more information.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">What platforms are supported?</h3>
              <p className="text-gray-600">
                We currently support Twitter, Reddit, LinkedIn, and more platforms coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Launch your AI agent in under 10 minutes. No credit card required.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="mailto:sales@example.com">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Nexa</h3>
              <p className="text-gray-600 text-sm">AI agent for marketing and content creation.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="#features" className="hover:text-black">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-black">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-black">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/about" className="hover:text-black">About</Link></li>
                <li><Link href="/blog" className="hover:text-black">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-black">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/privacy" className="hover:text-black">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-black">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2025 Nexa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
