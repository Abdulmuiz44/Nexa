import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Calendar, MessageSquare, Target, BarChart3, Zap, Users, Shield, Sparkles, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
            <Navbar />
            <main className="min-h-screen bg-white dark:bg-black pt-24">
                <PageHeader
                    badge="✨ Platform Features"
                    title="Everything You Need to Grow"
                    description="Powerful AI-driven features designed to automate your social media growth and save you hours every week."
                >
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Button variant="hero" size="lg" asChild>
                            <Link href="/auth/signup">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>
                </PageHeader>

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
                        {features.map((feature, idx) => (
                            <Card
                                key={idx}
                                className="group relative overflow-hidden rounded-3xl border-border bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/50 hover:shadow-neon"
                            >
                                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-${feature.color}/10 text-${feature.color} shadow-inner transition-all group-hover:scale-110`}>
                                    <feature.icon className="h-7 w-7" />
                                </div>

                                <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
                                <p className="mb-6 text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>

                                <div className="space-y-2">
                                    {feature.benefits.map((benefit, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <Sparkles className={`mt-0.5 h-4 w-4 flex-shrink-0 text-${feature.color}`} />
                                            <span className="text-sm text-muted-foreground">{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Integration Section */}
                <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-20">
                    <div className="container mx-auto px-4 text-center sm:px-6">
                        <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
                            Seamless Platform Integration
                        </h2>
                        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
                            Connect your social media accounts and start automating in minutes. We support all major platforms.
                        </p>

                        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
                            {[
                                { name: "Twitter / X", icon: "𝕏", desc: "Automated tweets, replies, and engagement" },
                                { name: "Reddit", icon: "R", desc: "Community posts and discussion participation" },
                                { name: "LinkedIn", icon: "in", desc: "Professional content and networking" },
                            ].map((platform, idx) => (
                                <Card key={idx} className="p-6">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary mx-auto">
                                        {platform.icon}
                                    </div>
                                    <h3 className="mb-2 font-semibold">{platform.name}</h3>
                                    <p className="text-sm text-muted-foreground">{platform.desc}</p>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-12">
                            <Link href="/integrations" className="text-primary hover:underline">
                                View all integrations →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 p-12 text-center">
                        <div className="absolute -top-24 right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                        <div className="relative">
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                                Ready to supercharge your social media?
                            </h2>
                            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                                Join 500+ founders and marketing teams who are growing faster with Nexa.
                            </p>
                            <Button variant="hero" size="lg" asChild>
                                <Link href="/auth/signup">
                                    Start Your Free Trial
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </section>

                <Footer />
            </main>
        </div>
    );
}
