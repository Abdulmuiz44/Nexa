'use client';

import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, User, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

// Placeholder blog posts
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
        // In a real app, this would fetch more posts from an API
        alert('Loading more articles...');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navbar />
            <main className="min-h-screen bg-white dark:bg-black pt-24">
                <PageHeader
                    badge="📝 Blog"
                    title="Insights on AI-Powered Growth"
                    description="Tips, strategies, and insights on social media automation, AI content creation, and growing your brand."
                />

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    {/* Categories */}
                    <div className="mb-12 flex flex-wrap justify-center gap-2">
                        {categories.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "hero" : "outline"}
                                size="sm"
                                onClick={() => handleCategorySelect(category)}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>

                    {/* Blog Grid */}
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {displayedPosts.map((post, idx) => (
                            <Card
                                key={idx}
                                className="group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-neon"
                            >
                                <div className="aspect-video w-full bg-secondary/30 flex items-center justify-center">
                                    <span className="text-4xl">📰</span>
                                </div>

                                <div className="p-6">
                                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                                            {post.category}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {post.readTime}
                                        </span>
                                    </div>

                                    <h3 className="mb-2 text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h3>

                                    <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between border-t border-border pt-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-4 w-4" />
                                            <span>{post.author}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{post.date}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Load More */}
                    <div className="mt-12 text-center">
                        <Button variant="outline" size="lg" onClick={handleLoadMore}>
                            Load More Articles
                        </Button>
                    </div>
                </section>

                {/* Newsletter CTA */}
                <section className="border-t border-border bg-secondary/20 py-20">
                    <div className="container mx-auto px-4 text-center sm:px-6">
                        <h2 className="mb-4 text-3xl font-bold">Never Miss an Update</h2>
                        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                            Get our latest blog posts, growth tips, and platform updates delivered to your inbox weekly.
                        </p>
                        {/* Newsletter form would go here - using the Newsletter Form component */}
                    </div>
                </section>

                <Footer />
            </main>
        </div>
    );
}
