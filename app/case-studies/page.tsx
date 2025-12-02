import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

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
        <>
            <Navbar />
            <main className="min-h-screen bg-background pt-24">
                <PageHeader
                    badge="💼 Success Stories"
                    title="Real Results from Real Companies"
                    description="See how companies like yours are using Nexa to accelerate their social media growth and drive real business outcomes."
                />

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <div className="space-y-20">
                        {caseStudies.map((study, idx) => (
                            <Card key={idx} className="overflow-hidden rounded-3xl border-border bg-card/50 backdrop-blur-sm">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 sm:p-12">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="mb-2 text-3xl font-bold">{study.company}</h2>
                                            <p className="text-muted-foreground">{study.industry}</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-semibold text-primary">Success Story</span>
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
                                                <p className="text-muted-foreground leading-relaxed">{study.challenge}</p>
                                            </div>
                                            <div>
                                                <h3 className="mb-3 text-xl font-semibold">The Solution</h3>
                                                <p className="text-muted-foreground leading-relaxed">{study.solution}</p>
                                            </div>
                                        </div>

                                        {/* Results Grid */}
                                        <div>
                                            <h3 className="mb-4 text-xl font-semibold">The Results</h3>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {study.results.map((result, i) => (
                                                    <Card key={i} className="bg-secondary/30 p-4">
                                                        <div className="mb-2 text-3xl font-bold text-primary">{result.value}</div>
                                                        <div className="mb-1 text-sm font-semibold">{result.metric}</div>
                                                        <div className="text-xs text-muted-foreground">{result.description}</div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Testimonial */}
                                    <Card className="mt-8 border-l-4 border-l-primary bg-primary/5 p-6">
                                        <p className="mb-4 text-lg italic">"{study.testimonial}"</p>
                                        <p className="font-semibold">— {study.author}</p>
                                    </Card>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 p-12 text-center">
                        <div className="absolute -top-24 right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
                        <div className="relative">
                            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                                Ready to Write Your Success Story?
                            </h2>
                            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                                Join hundreds of companies achieving remarkable growth with Nexa's AI-powered social media automation.
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
        </>
    );
}
