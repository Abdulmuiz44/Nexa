'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Clock, User } from 'lucide-react';
import { useState } from 'react';

const blogPosts = [
    {
        title: "10 Social Media Automation Strategies That Actually Work in 2024",
        excerpt: "Learn the proven automation strategies that top brands use to scale their social media presence without sacrificing authenticity.",
        author: "Sarah Johnson",
        date: "Dec 1, 2024",
        readTime: "8 min read",
        category: "Strategy",
        image: "/blog/automation-strategies.jpg",
    },
    {
        title: "How AI is Revolutionizing Content Creation for Social Media",
        excerpt: "Discover how artificial intelligence is changing the game for content creators and marketers across all platforms.",
        author: "Michael Chen",
        date: "Nov 28, 2024",
        readTime: "6 min read",
        category: "AI & Technology",
        image: "/blog/ai-content.jpg",
    },
    {
        title: "The Complete Guide to Reddit Marketing for SaaS Companies",
        excerpt: "Everything you need to know about building a successful marketing presence on Reddit without getting banned or downvoted.",
        author: "Jessica Rodriguez",
        date: "Nov 25, 2024",
        readTime: "12 min read",
        category: "Platforms",
        image: "/blog/reddit-marketing.jpg",
    },
    {
        title: "From 0 to 10K Followers: A Real-World Growth Case Study",
        excerpt: "How one startup grew their Twitter following from zero to 10,000 engaged followers in just 4 months using Nexa.",
        author: "Alex Thompson",
        date: "Nov 22, 2024",
        readTime: "10 min read",
        category: "Case Studies",
        image: "/blog/growth-case-study.jpg",
    },
    {
        title: "Best Times to Post on Social Media in 2024 (Data-Driven Insights)",
        excerpt: "We analyzed millions of posts to find the optimal posting times for each major platform. Here's what we discovered.",
        author: "David Park",
        date: "Nov 18, 2024",
        readTime: "7 min read",
        category: "Analytics",
        image: "/blog/best-times.jpg",
    },
    {
        title: "Building a Brand Voice: How to Train AI to Sound Like You",
        excerpt: "Step-by-step guide to creating consistent, authentic-sounding content using AI while maintaining your unique brand voice.",
        author: "Emma Wilson",
        date: "Nov 15, 2024",
        readTime: "9 min read",
        category: "Content Creation",
        image: "/blog/brand-voice.jpg",
    },
];

const categories = ["All", "Strategy", "AI & Technology", "Platforms", "Case Studies", "Analytics", "Content Creation"];

export default function BlogPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [displayedPosts, setDisplayedPosts] = useState(blogPosts);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        if (category === "All") {
            setDisplayedPosts(blogPosts);
        } else {
            setDisplayedPosts(blogPosts.filter(post => post.category === category));
        }
    };

    const handleLoadMore = () => {
        alert('Loading more articles...');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        📝 Blog
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Insights on AI-Powered Growth</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Tips, strategies, and insights on social media automation, AI content creation, and growing your brand.
                    </p>
                </div>
            </section>

            {/* Categories */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-12">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleCategorySelect(category)}
                                className={selectedCategory === category ? "bg-black dark:bg-white text-white dark:text-black" : "border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {displayedPosts.map((post, idx) => (
                            <div
                                key={idx}
                                className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                            >
                                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4 rounded-lg">
                                    <span className="text-4xl">📰</span>
                                </div>

                                <div className="mb-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span className="rounded-full bg-gray-100 dark:bg-gray-900 px-2 py-1">
                                        {post.category}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {post.readTime}
                                    </span>
                                </div>

                                <h3 className="mb-2 text-lg font-semibold line-clamp-2">
                                    {post.title}
                                </h3>

                                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                    {post.excerpt}
                                </p>

                                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <User className="h-4 w-4" />
                                        <span>{post.author}</span>
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{post.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More */}
                    <div className="mt-12 text-center">
                        <Button variant="outline" size="lg" onClick={handleLoadMore} className="border-gray-300 dark:border-gray-700 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">
                            Load More Articles
                        </Button>
                    </div>
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="mb-4 text-3xl font-bold">Never Miss an Update</h2>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                        Get our latest blog posts, growth tips, and platform updates delivered to your inbox weekly.
                    </p>
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
