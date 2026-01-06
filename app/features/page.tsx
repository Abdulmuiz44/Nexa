'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Bot, Calendar, MessageSquare, Target, BarChart3, Zap, Users, Shield, Sparkles, Clock, TrendingUp, ArrowRight } from 'lucide-react';

const features = [
    {
        icon: Bot,
        title: "AI Content Generation",
        description: "Create engaging posts, tweets, and replies in seconds. Our Mistral-powered AI learns from your best-performing content and generates platform-optimized content that matches your brand voice perfectly.",
        benefits: [
            "Multi-platform content optimization",
            "Brand voice learning and adaptation",
            "Unlimited content variations",
            "Real-time trend integration",
        ],
        color: "primary",
    },
    {
        icon: Calendar,
        title: "Smart Scheduling",
        description: "Automatically post content at optimal times for maximum reach and engagement. Our AI analyzes your audience behavior patterns to determine the best posting schedule across all platforms.",
        benefits: [
            "AI-powered timing optimization",
            "Cross-platform scheduling",
            "Bulk scheduling support",
            "Timezone-aware posting",
        ],
        color: "accent",
    },
    {
        icon: MessageSquare,
        title: "Auto-Engagement",
        description: "Never miss a community moment. Our AI actively monitors relevant discussions, replies to comments and mentions, and engages with your target audience 24/7 to build relationships.",
        benefits: [
            "Intelligent comment responses",
            "Mention monitoring and replies",
            "Community discussion participation",
            "Personalized engagement",
        ],
        color: "primary",
    },
    {
        icon: Target,
        title: "Smart Targeting",
        description: "Identify and engage with trending subreddits, hashtags, and communities where your target audience is most active. Our AI finds the perfect opportunities for your brand.",
        benefits: [
            "Trending topic discovery",
            "Audience behavior analysis",
            "Community recommendation engine",
            "Competitor monitoring",
        ],
        color: "accent",
    },
    {
        icon: BarChart3,
        title: "Analytics Dashboard",
        description: "Track impressions, engagement, clicks, and growth with beautiful, real-time analytics. See your ROI at a glance and make data-driven decisions with comprehensive insights.",
        benefits: [
            "Real-time performance metrics",
            "Custom date range analysis",
            "Engagement rate tracking",
            "ROI calculation tools",
        ],
        color: "primary",
    },
    {
        icon: Zap,
        title: "Campaign Mode",
        description: "Run automated multi-post campaigns for product launches, updates, or special promotions. Coordinate content across platforms to maximize your impact and reach.",
        benefits: [
            "Multi-platform campaign coordination",
            "Performance tracking per campaign",
            "A/B testing capabilities",
            "Campaign templates library",
        ],
        color: "accent",
    },
    {
        icon: Users,
        title: "Team Collaboration",
        description: "Work together seamlessly with your team. Assign roles, manage permissions, and collaborate on content creation with built-in approval workflows.",
        benefits: [
            "Role-based access control",
            "Content approval workflows",
            "Team activity tracking",
            "Collaborative content editing",
        ],
        color: "primary",
    },
    {
        icon: Shield,
        title: "Brand Safety",
        description: "Stay in control with custom content rules, approval workflows, and brand guidelines. Every post is checked against your standards before publishing.",
        benefits: [
            "Custom content guidelines",
            "Automated compliance checks",
            "Manual approval options",
            "Content moderation tools",
        ],
        color: "accent",
    },
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        ✨ Platform Features
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Everything You Need to Grow</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                        Powerful AI-driven features designed to automate your social media growth and save you hours every week.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                            <Link href="/auth/signup">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900" asChild>
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <main className="min-h-screen bg-white dark:bg-black">
                <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                    <div className="mx-auto max-w-6xl">
                    <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                            >
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                                    <feature.icon className="h-6 w-6" />
                                </div>

                                <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
                                <p className="mb-6 text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>

                                <div className="space-y-2">
                                    {feature.benefits.map((benefit, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    </div>
                </section>

                {/* Integration Section */}
                <section className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-6 py-20">
                    <div className="mx-auto max-w-6xl text-center">
                        <h2 className="mb-6 text-4xl font-bold">
                            Seamless Platform Integration
                        </h2>
                        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                            Connect your social media accounts and start automating in minutes. We support all major platforms.
                        </p>

                        <div className="mx-auto grid max-w-4xl gap-6 grid-cols-1 sm:grid-cols-3">
                            {[
                                { name: "Twitter / X", icon: "𝕏", desc: "Automated tweets, replies, and engagement" },
                                { name: "Reddit", icon: "R", desc: "Community posts and discussion participation" },
                                { name: "LinkedIn", icon: "in", desc: "Professional content and networking" },
                            ].map((platform, idx) => (
                                <div key={idx} className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900 text-2xl font-bold text-black dark:text-white mx-auto">
                                        {platform.icon}
                                    </div>
                                    <h3 className="mb-2 font-semibold">{platform.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{platform.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12">
                            <Link href="/integrations" className="text-black dark:text-white hover:underline">
                                View all integrations →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="relative p-12">
                            <h2 className="mb-4 text-4xl font-bold">
                                Ready to supercharge your social media?
                            </h2>
                            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                                Join 500+ founders and marketing teams who are growing faster with Nexa.
                            </p>
                            <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                                <Link href="/auth/signup">
                                    Start Your Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
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
            </main>
        </div>
    );
}
