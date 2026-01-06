'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { BookOpen, MessageSquare, TrendingUp, Settings } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <Navigation />

      {/* Hero */}
      <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
            📚 Documentation
          </div>
          <h1 className="text-5xl font-bold mb-6">Help & Documentation</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about using Nexa for your social media management
          </p>
        </div>
      </section>

      {/* Getting Started & Advanced */}
      <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Getting Started
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">1. Complete Your Profile</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Set up your business information and brand preferences
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">2. Connect Social Accounts</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Link your Twitter/X and Reddit accounts for automated posting
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">3. Chat with Nexa</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask our AI assistant to create content and manage campaigns
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Advanced Features
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Campaign Management</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Schedule posts and track performance across platforms
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Analytics & Reporting</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View detailed engagement metrics and growth trends
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">AI-Powered Content</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate optimized posts matching your brand voice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12 text-center flex items-center justify-center gap-3">
            <Settings className="h-8 w-8" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h4 className="font-semibold mb-3">How does Nexa generate content?</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Nexa uses advanced AI models to create content tailored to your brand voice, target audience, and platform requirements. Simply chat with our AI assistant and specify what you need.
              </p>
            </div>

            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h4 className="font-semibold mb-3">Can I schedule posts in advance?</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! Use the Campaigns section to create and schedule posts. Nexa will automatically publish them at your specified times across connected platforms.
              </p>
            </div>

            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h4 className="font-semibold mb-3">What social platforms are supported?</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Currently supported: Twitter/X and Reddit. We're continuously adding more platforms. Connect your accounts in the Connections section.
              </p>
            </div>

            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <h4 className="font-semibold mb-3">How do credits work?</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Credits are used for AI content generation, posting, and analytics. View your usage in the Billing section and top up when needed.
              </p>
            </div>
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
                <li><Link href="/#features" className="hover:text-black dark:hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-black dark:hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-black dark:hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-black dark:hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">&copy; 2025 Nexa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
