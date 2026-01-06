'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight } from 'lucide-react';

const caseStudies = [
    {
        company: "CloudSync",
        industry: "SaaS - Cloud Storage",
        challenge: "CloudSync struggled to gain traction on social media despite having a superior product. Their small marketing team couldn't keep up with consistent posting and engagement.",
        solution: "Implemented Nexa's AI-powered content generation and auto-engagement across Reddit, Twitter, and LinkedIn. Set up automated posting schedules optimized for each platform.",
        results: [
            { metric: "Follower Growth", value: "+900%", description: "From 5K to 50K followers in 6 months" },
            { metric: "Engagement Rate", value: "4.2x", description: "Quadrupled engagement vs manual posting" },
            { metric: "Time Saved", value: "15 hrs/week", description: "Marketing team refocused on strategy" },
            { metric: "Leads Generated", value: "2,100+", description: "Qualified leads from social traffic" },
        ],
        testimonial: "Nexa reduced my weekly social media work from 15 hours to just 2. We went from 5K followers to 50K in 6 months with better engagement.",
        author: "Sarah Johnson, Founder",
    },
    {
        company: "TechFlow Inc.",
        industry: "B2B SaaS - Workflow Automation",
        challenge: "With a lean team focused on product development, TechFlow's LinkedIn presence was inconsistent and their content lacked the polish needed for B2B audiences.",
        solution: "Deployed Nexa's Mistral AI-powered content creation with custom brand voice training. Automated LinkedIn posting and comment engagement for thought leadership.",
        results: [
            { metric: "LinkedIn Engagement", value: "3.2x", description: "Tripled engagement rate in 60 days" },
            { metric: "Demo Requests", value: "+240%", description: "Directly attributed to LinkedIn activity" },
            { metric: "Employee Advocacy", value: "5x", description: "Team members sharing company content" },
            { metric: "Executive Visibility", value: "+180%", description: "CEO's profile views increased" },
        ],
        testimonial: "The AI truly understands our brand voice. Our LinkedIn engagement rate jumped 3.2x. It's like having a full-time growth marketer that never sleeps.",
        author: "Michael Chen, CMO",
    },
    {
        company: "BuildStack",
        industry: "Developer Tools",
        challenge: "BuildStack needed to reach developers where they congregate (Reddit, Twitter) but lacked the resources and expertise to navigate these communities authentically.",
        solution: "Used Nexa's smart targeting to identify relevant developer communities. AI-generated authentic, value-first content that resonated with technical audiences.",
        results: [
            { metric: "Reddit Karma", value: "12,500+", description: "Positive community engagement" },
            { metric: "Qualified Leads", value: "2,400+", description: "High-intent developer signups" },
            { metric: "Community Trust", value: "94%", description: "Positive sentiment in mentions" },
            { metric: "Support Reduction", value: "-35%", description: "Community answers questions" },
        ],
        testimonial: "What impressed us most is the brand safety. Every post aligns with our values. We gained 2,400 qualified leads through Reddit engagement—something we couldn't do manually.",
        author: "Jessica Rodriguez, Growth Lead",
    },
];

export default function CaseStudiesPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        💼 Success Stories
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Real Results from Real Companies</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        See how companies like yours are using Nexa to accelerate their social media growth and drive real business outcomes.
                    </p>
                </div>
            </section>

            {/* Case Studies */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl space-y-16">
                    {caseStudies.map((study, idx) => (
                        <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="bg-gray-50 dark:bg-gray-950 p-8 sm:p-12 border-b border-gray-200 dark:border-gray-800">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="mb-2 text-3xl font-bold">{study.company}</h2>
                                        <p className="text-gray-600 dark:text-gray-400">{study.industry}</p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-900 px-4 py-2">
                                        <TrendingUp className="h-4 w-4 text-black dark:text-white" />
                                        <span className="text-sm font-semibold">Success Story</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 sm:p-12">
                                <div className="grid gap-8 lg:grid-cols-2">
                                    {/* Challenge & Solution */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="mb-3 text-xl font-semibold">The Challenge</h3>
                                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{study.challenge}</p>
                                        </div>
                                        <div>
                                            <h3 className="mb-3 text-xl font-semibold">The Solution</h3>
                                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{study.solution}</p>
                                        </div>
                                    </div>

                                    {/* Results Grid */}
                                    <div>
                                        <h3 className="mb-4 text-xl font-semibold">The Results</h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {study.results.map((result, i) => (
                                                <div key={i} className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                                                    <div className="mb-2 text-3xl font-bold">{result.value}</div>
                                                    <div className="mb-1 text-sm font-semibold">{result.metric}</div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">{result.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Testimonial */}
                                <div className="mt-8 border-l-4 border-l-gray-400 bg-gray-50 dark:bg-gray-950 p-6 rounded-r">
                                    <p className="mb-4 text-lg italic">"{study.testimonial}"</p>
                                    <p className="font-semibold">— {study.author}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20 bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="mb-6 text-4xl font-bold">
                        Ready to Write Your Success Story?
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                        Join hundreds of companies achieving remarkable growth with Nexa's AI-powered social media automation.
                    </p>
                    <Button asChild size="lg" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                        <Link href="/auth/signup">
                            Start Your Free Trial
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
