import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import TrustedBy from '@/components/TrustedBy';
import Differentiation from '@/components/Differentiation';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import AgentChat from '@/components/AgentChat';
import ContentGenerator from '@/components/ContentGenerator';
import PricingCard from '@/components/PricingCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock3, ShieldCheck, Sparkles } from 'lucide-react';

const highlightCards = [
    {
        icon: Sparkles,
        title: 'AI Content Generation',
        description:
            'Generates brand-aligned posts, tweets, and community replies in seconds. Learns from your best-performing content.',
    },
    {
        icon: ShieldCheck,
        title: 'Brand Safety First',
        description:
            'Set custom approval workflows, content rules, and brand guidelines. Every post checked before publishing.',
    },
    {
        icon: Clock3,
        title: 'Always-On Engagement',
        description:
            'Post, reply, and engage 24/7 across Reddit, X, LinkedIn. Never miss a community moment or engagement opportunity.',
    },
];

const pricingPlans = [
    {
        planId: 'starter',
        title: 'Starter',
        tagline: 'Solo founders with core AI + analytics',
        price: '$49',
        period: '/mo',
        features: [
            'Core AI content generation',
            'Basic analytics tracking',
            'Single platform integration',
            'Community engagement tools',
        ],
        ctaHref: '/auth/signup',
    },
    {
        planId: 'growth',
        title: 'Growth',
        tagline: 'Startups/agencies with multi-agent + cross-platform',
        price: '$99',
        period: '/mo',
        features: [
            'Everything in Starter',
            'Multi-agent automation',
            'Cross-platform posting',
            'Advanced analytics dashboard',
        ],
        highlighted: true,
        ctaHref: '/auth/signup',
    },
    {
        planId: 'scale',
        title: 'Scale',
        tagline: 'Agencies with dedicated instance + white-label + API',
        price: '$199',
        period: '/mo',
        features: [
            'Everything in Growth',
            'Dedicated instance',
            'White-label options',
            'Full API access',
        ],
        ctaHref: '/auth/signup',
    },
];

export default function LandingPage() {
    return (
        <>
            <Navbar />
            <main className="relative min-h-screen overflow-hidden bg-background pt-24 sm:pt-28">
                <div className="pointer-events-none absolute -top-32 left-1/2 hidden h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-3xl lg:block" />
                <div className="pointer-events-none absolute bottom-0 right-[-10%] hidden h-[28rem] w-[28rem] rounded-full bg-gradient-to-tl from-secondary/40 via-secondary/10 to-transparent blur-3xl lg:block" />

                <div className="relative flex flex-col gap-20 sm:gap-24">
                    {/* 1. Hero - Problem focused */}
                    <Hero />

                    {/* 2. Social proof - Stats and trust */}
                    <TrustedBy />

                    {/* 3. Core value proposition */}
                    <section className="relative">
                        <div className="container mx-auto px-4 sm:px-6">
                            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
                                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                    How It Works
                                </span>
                                <h2 className="mt-6 text-3xl font-bold sm:text-4xl md:text-5xl">
                                    Three core pillars of Nexa
                                </h2>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    Content generation, brand-safe posting, and continuous engagement—all automated and under your control.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                                {highlightCards.map((item) => (
                                    <Card
                                        key={item.title}
                                        className="group relative overflow-hidden rounded-3xl border-primary/10 bg-card/40 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-neon sm:p-6"
                                    >
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-semibold">{item.title}</h3>
                                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                            {item.description}
                                        </p>
                                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 4. Detailed features */}
                    <Features />

                    {/* 5. Live demo - DONT TOUCH */}
                    <section id="experience" className="relative py-12">
                        <div className="container mx-auto px-4 sm:px-6">
                            <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
                                <span className="inline-flex items-center gap-2 rounded-full bg-secondary/30 px-4 py-2 text-sm font-semibold text-foreground">
                                    See it in action
                                </span>
                                <h2 className="mt-6 text-3xl font-bold sm:text-4xl md:text-5xl">Your AI operator at work</h2>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    Preview the live agent console your team will use to ideate content, collaborate with AI, and launch campaigns instantly.
                                </p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="group rounded-3xl border border-primary/10 bg-card/40 p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 sm:p-4">
                                    <AgentChat />
                                </div>
                                <div className="group rounded-3xl border border-primary/10 bg-card/40 p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 sm:p-4">
                                    <ContentGenerator />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 6. Setup walkthrough */}
                    <HowItWorks />

                    {/* 7. Why Nexa is different */}
                    <Differentiation />

                    {/* 8. Social proof with metrics */}
                    <Testimonials />

                    {/* 9. Pricing */}
                    <section id="pricing" className="relative py-20 sm:py-24">
                        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-secondary/20 via-background to-background" />
                        <div className="container mx-auto px-4 sm:px-6">
                            <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
                                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                    Pricing plans
                                </span>
                                <h2 className="mt-6 text-3xl font-bold sm:text-4xl md:text-5xl">Choose the runway that fits</h2>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    Simple, transparent pricing with credits that scale as you do. No hidden fees, no surprise add-ons.
                                </p>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {pricingPlans.map((plan) => (
                                    <PricingCard key={plan.planId} {...plan} />
                                ))}
                            </div>
                            <p className="mt-8 text-center text-sm text-muted-foreground">
                                Need a custom setup or compliance review?{' '}
                                <Link href="mailto:sales@example.com" className="text-primary underline underline-offset-4">
                                    Talk to our team
                                </Link>
                            </p>
                        </div>
                    </section>

                    {/* 10. Address objections */}
                    <FAQSection />

                    {/* 11. Final CTA */}
                    <section className="container mx-auto px-4 pb-20 sm:px-6 sm:pb-24">
                        <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 px-6 py-10 sm:px-8 sm:py-12">
                            <div className="absolute -top-24 right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                            <div className="relative grid gap-8 md:grid-cols-[2fr,1fr] md:items-center">
                              <div>
                                <h2 className="text-3xl font-bold sm:text-4xl">Ready to stop wasting time on social media?</h2>
                                <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                                  Get back 15+ hours per week. Launch your Nexa agent in under 10 minutes and let it drive growth while you focus on building your product.
                                </p>
                              </div>
                              <div className="flex flex-col gap-3 sm:gap-4 md:items-end">
                                <Button variant="hero" size="lg" className="group" asChild>
                                  <Link href="/auth/signup">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                  </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="border-primary/40" asChild>
                                  <Link href="/docs">View Documentation</Link>
                                </Button>
                              </div>
                            </div>
                        </Card>
                    </section>

                    <Footer />
                </div>
            </main>
        </>
    );
}
