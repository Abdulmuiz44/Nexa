'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function AboutPage() {
    const handleCareersClick = () => {
        window.location.href = 'mailto:careers@nexa.ai';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        🚀 Our Story
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Building the Future of Social Media Marketing</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Nexa was born from a simple observation: founders and marketers spend too much time on social media with too little results.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        We believe that every startup and business deserves to have a world-class social media presence without dedicating countless hours to manual posting and engagement. Our mission is to democratize social media marketing through AI automation, allowing founders and teams to focus on what they do best: building great products.
                    </p>
                </div>
            </section>

            {/* Story */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20 bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-4xl font-bold mb-6">How We Started</h2>
                    <p className="mb-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        After launching multiple SaaS products and spending 15+ hours weekly on social media with minimal results, our founders knew there had to be a better way. They assembled a team of AI researchers, growth marketers, and engineers to build Nexa—an autonomous AI agent that handles everything from content creation to community engagement.
                    </p>
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        Today, Nexa helps over 500 companies automate their social media growth, saving thousands of hours and driving real business results.
                    </p>
                </div>
            </section>

            {/* Values */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-4xl font-bold mb-12 text-center">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            {
                                title: "Automation First",
                                description: "We believe in automating repetitive tasks so humans can focus on creativity and strategy."
                            },
                            {
                                title: "Transparency",
                                description: "Clear pricing, honest metrics, and complete control over your content."
                            },
                            {
                                title: "Innovation",
                                description: "Leveraging cutting-edge AI technology to solve real marketing challenges."
                            },
                            {
                                title: "Customer Success",
                                description: "Your growth is our success. We're committed to delivering real, measurable results."
                            },
                        ].map((value, idx) => (
                            <div key={idx} className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                                <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team & Careers */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20 bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-4xl font-bold mb-6 text-center">Meet the Team</h2>
                    <p className="mb-8 text-lg text-gray-600 dark:text-gray-400 text-center">
                        We're a distributed team of engineers, designers, and growth experts passionate about making social media marketing accessible to everyone.
                    </p>
                    <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors text-center cursor-pointer" onClick={handleCareersClick}>
                        <h3 className="mb-2 text-2xl font-semibold">Want to join us?</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                            We're always looking for talented people who share our vision.
                        </p>
                        <div className="font-semibold text-black dark:text-white hover:underline cursor-pointer">
                            View Open Positions →
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-4xl font-bold mb-12 text-center">By the Numbers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Active Users", value: "500+" },
                            { label: "Posts Published", value: "12,500+" },
                            { label: "Hours Saved", value: "7,500+" },
                        ].map((stat, idx) => (
                            <div key={idx} className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors text-center">
                                <div className="mb-2 text-4xl font-bold">{stat.value}</div>
                                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                            </div>
                        ))}
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
