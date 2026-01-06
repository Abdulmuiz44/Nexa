'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import PricingCard from "@/components/PricingCard";
import { Button } from "@/components/ui/button";

const pricingPlans = [
    {
        title: "Growth",
        planId: "growth",
        price: 49,
        tagline: "Hire your first AI growth assistant.",
        period: "/month",
        features: [
            "1 AI tool/project",
            "Unlimited posts (Reddit + X)",
            "AI Growth Agent (auto-replies & engagement)",
            "Smart scheduling (best times to post)",
            "Content variations & A/B testing",
            "Campaign mode (launches, feature promos)",
            "Full analytics dashboard",
            "Weekly AI Growth Report",
            "Priority email/chat support",
        ],
    },
    {
        title: "Scale",
        planId: "scale",
        price: 149,
        tagline: "Run campaigns like a full-time growth team.",
        period: "/month",
        features: [
            "Up to 5 AI tools/projects",
            "Autonomous multi-agent campaigns (different personas)",
            "Platforms: Reddit, X, Product Hunt, Indie Hackers",
            "Advanced analytics (sentiment, post performance, funnel tracking)",
            "Smart targeting (trending hashtags/subreddits)",
            "Campaign templates & automation library",
            "White-label PDF/Excel reports",
            "Priority human + AI success manager",
            "Early access to new features",
        ],
        highlighted: true,
    },
    {
        title: "Enterprise",
        planId: "enterprise",
        price: 499,
        tagline: "Your entire AI growth department in the cloud.",
        period: "/month",
        features: [
            "Unlimited AI tools/projects",
            "Dedicated private Nexa instance",
            "Custom integrations (LinkedIn, Slack, CRM, Webhooks)",
            "Multi-agent orchestration (custom personas + AI brand tone)",
            "Dedicated success manager & quarterly strategy sessions",
            "White-label branding (own logo/domain)",
            "API access + advanced analytics exports",
            "99.9% uptime SLA",
        ],
    },
];

const Pricing = () => {
    const [loading, setLoading] = useState(false);

    const handlePlanSelect = async (planId: string) => {
        setLoading(true);
        try {
            const plan = pricingPlans.find(p => p.planId === planId);
            if (!plan) return;

            const response = await fetch('/api/subscriptions/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, amount: plan.price }),
            });

            const data = await response.json();
            if (data.paymentLink) {
                window.location.href = data.paymentLink;
            } else {
                alert('Error initializing payment. Please try again.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Error initializing payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleContactSales = () => {
        window.location.href = 'mailto:support@nexaagent.app?subject=Enterprise%20Plan%20Inquiry';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        💰 Pricing
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Choose the plan that fits your growth goals. No hidden fees, cancel anytime.
                    </p>
                </div>
            </section>

            <main className="pb-16">
                {/* Pricing Cards */}
                <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            {pricingPlans.map((plan, idx) => (
                                <PricingCard key={idx} {...plan} onSelect={handlePlanSelect} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20 bg-gray-50 dark:bg-gray-950">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Contact our sales team to discuss custom pricing and solutions for your specific needs.
                        </p>
                        <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" onClick={handleContactSales}>
                            <div>Contact Sales</div>
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
            </main>
        </div>
    );
};

export default Pricing;
