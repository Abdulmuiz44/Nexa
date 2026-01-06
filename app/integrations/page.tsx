'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

const integrations = [
    {
        name: "Twitter / X",
        icon: "𝕏",
        description: "Automate tweets, threads, replies, and engagement on the world's real-time conversation platform.",
        features: [
            "Automated tweet posting",
            "Thread creation and scheduling",
            "Auto-reply to mentions and DMs",
            "Hashtag and trend monitoring",
            "Analytics and engagement tracking",
        ],
        status: "Available",
    },
    {
        name: "Reddit",
        icon: "R",
        description: "Participate authentically in relevant subreddits, post content, and engage with communities.",
        features: [
            "Subreddit post automation",
            "Comment and discussion engagement",
            "Karma and sentiment tracking",
            "Community discovery",
            "Compliance with subreddit rules",
        ],
        status: "Available",
    },
    {
        name: "LinkedIn",
        icon: "in",
        description: "Build thought leadership with automated professional content and networking.",
        features: [
            "Post and article scheduling",
            "Comment engagement automation",
            "Connection request management",
            "Company page management",
            "B2B lead generation tools",
        ],
        status: "Available",
    },
    {
        name: "Facebook",
        icon: "f",
        description: "Manage your Facebook presence with automated posts and page management.",
        features: [
            "Page post scheduling",
            "Group participation",
            "Comment moderation",
            "Ad integration insights",
            "Analytics dashboard",
        ],
        status: "Coming Soon",
    },
    {
        name: "Instagram",
        icon: "IG",
        description: "Visual content automation for posts, stories, and reels.",
        features: [
            "Post and story scheduling",
            "Hashtag optimization",
            "Comment engagement",
            "Influencer collaboration tools",
            "Performance analytics",
        ],
        status: "Coming Soon",
    },
    {
        name: "TikTok",
        icon: "TT",
        description: "Short-form video content creation and posting automation.",
        features: [
            "Video posting automation",
            "Trend identification",
            "Comment engagement",
            "Duet and stitch opportunities",
            "Analytics tracking",
        ],
        status: "Coming Soon",
    },
];

export default function IntegrationsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        🔗 Integrations
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Connect All Your Platforms</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Nexa integrates with all major social media platforms to provide seamless, unified automation across your entire social presence.
                    </p>
                </div>
            </section>

            {/* Integrations Grid */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {integrations.map((integration, idx) => (
                            <div
                                key={idx}
                                className={`p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors relative ${
                                    integration.status === "Coming Soon" ? "opacity-75" : ""
                                }`}
                            >
                                {integration.status === "Coming Soon" && (
                                    <div className="absolute right-4 top-4 rounded-full bg-gray-200 dark:bg-gray-800 px-3 py-1 text-xs font-semibold">
                                        Coming Soon
                                    </div>
                                )}

                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 text-3xl font-bold">
                                    {integration.icon}
                                </div>

                                <h3 className="mb-3 text-2xl font-bold">{integration.name}</h3>
                                <p className="mb-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {integration.description}
                                </p>

                                <div className="space-y-2 mb-6">
                                    {integration.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-black dark:text-white" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {integration.status === "Available" && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                                        asChild
                                    >
                                        <Link href="/auth/signup">
                                            Connect Now
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="mb-6 text-4xl font-bold">How Integration Works</h2>
                        <p className="mb-12 text-lg text-gray-600 dark:text-gray-400">
                            Connecting your social media accounts to Nexa is quick, secure, and takes less than 2 minutes per platform.
                        </p>

                        <div className="grid gap-6 sm:grid-cols-3">
                            {[
                                { step: "1", title: "Authorize", description: "Securely connect via OAuth 2.0" },
                                { step: "2", title: "Configure", description: "Set your posting preferences" },
                                { step: "3", title: "Automate", description: "Let Nexa handle the rest" },
                            ].map((item, idx) => (
                                <div key={idx} className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
                                    <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black font-bold">
                                        {item.step}
                                    </div>
                                    <h3 className="mb-2 font-semibold">{item.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="mb-6 text-4xl font-bold">
                        Ready to Connect Your Accounts?
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                        Start automating your social media presence across all platforms in minutes.
                    </p>
                    <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                        <Link href="/auth/signup">
                            Get Started Free
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
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
