import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

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
        <>
            <Navbar />
            <main className="min-h-screen bg-background pt-24">
                <PageHeader
                    badge="🔗 Integrations"
                    title="Connect All Your Platforms"
                    description="Nexa integrates with all major social media platforms to provide seamless, unified automation across your entire social presence."
                />

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {integrations.map((integration, idx) => (
                            <Card
                                key={idx}
                                className={`group relative overflow-hidden rounded-3xl border-border bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-neon ${integration.status === "Coming Soon" ? "opacity-75" : ""
                                    }`}
                            >
                                {integration.status === "Coming Soon" && (
                                    <div className="absolute right-4 top-4 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                                        Coming Soon
                                    </div>
                                )}

                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary shadow-inner transition-all group-hover:scale-110">
                                    {integration.icon}
                                </div>

                                <h3 className="mb-3 text-2xl font-bold">{integration.name}</h3>
                                <p className="mb-6 text-muted-foreground leading-relaxed">
                                    {integration.description}
                                </p>

                                <div className="space-y-2">
                                    {integration.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                            <span className="text-sm text-muted-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {integration.status === "Available" && (
                                    <Button
                                        variant="outline"
                                        className="mt-6 w-full"
                                        asChild
                                    >
                                        <Link href="/auth/signup">
                                            Connect Now
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}

                                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </Card>
                        ))}
                    </div>
                </section>

                {/* How It Works */}
                <section className="border-t border-border bg-secondary/20 py-20">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="mb-6 text-3xl font-bold">How Integration Works</h2>
                            <p className="mb-12 text-lg text-muted-foreground">
                                Connecting your social media accounts to Nexa is quick, secure, and takes less than 2 minutes per platform.
                            </p>

                            <div className="grid gap-6 sm:grid-cols-3">
                                {[
                                    { step: "1", title: "Authorize", description: "Securely connect via OAuth 2.0" },
                                    { step: "2", title: "Configure", description: "Set your posting preferences" },
                                    { step: "3", title: "Automate", description: "Let Nexa handle the rest" },
                                ].map((item, idx) => (
                                    <Card key={idx} className="p-6">
                                        <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                                            {item.step}
                                        </div>
                                        <h3 className="mb-2 font-semibold">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 p-12 text-center">
                        <div className="absolute -top-24 right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                        <div className="relative">
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                                Ready to Connect Your Accounts?
                            </h2>
                            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                                Start automating your social media presence across all platforms in minutes.
                            </p>
                            <Button variant="hero" size="lg" asChild>
                                <Link href="/auth/signup">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </section>

                <Footer />
            </main>
        </>
    );
}
