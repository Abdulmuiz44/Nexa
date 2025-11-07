import { Bot, Calendar, MessageSquare, BarChart3, Zap, Target, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const features = [
  {
    icon: Bot,
    title: "AI Content Generation",
    description: "Our AI creates engaging posts, tweets, and replies in multiple tones, tailored to your brand voice. Save hours on content creation.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automatically post content at optimal times for maximum reach and engagement across all your social media platforms.",
  },
  {
    icon: MessageSquare,
    title: "Auto-Engagement",
    description: "Our AI replies to comments, mentions, and relevant discussions to build relationships and drive traffic back to your website.",
  },
  {
    icon: Target,
    title: "Smart Targeting",
    description: "Identify trending subreddits, hashtags, and communities where your target audience is most active and engaged.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track impressions, engagement, clicks, and growth with our beautiful, real-time analytics dashboard. See your ROI at a glance.",
  },
  {
    icon: Zap,
    title: "Campaign Mode",
    description: "Run automated multi-post campaigns for product launches, updates, or special promotions to maximize your impact.",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-24">
      <div className="absolute inset-0 bg-gradient-glow opacity-40" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6">
        <div className="mb-14 flex flex-col items-center text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          Your Growth Team,
          <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent"> Automated</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
          Nexa handles every aspect of your social media growth strategy with intelligent automation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 px-2 sm:grid-cols-2 sm:gap-6 sm:px-0 lg:grid-cols-3">
        {features.map((feature, idx) => (
        <Card
        key={idx}
        className="group flex h-full flex-col rounded-3xl border-border bg-card/50 p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-primary/50 hover:shadow-neon sm:p-6"
            >
              <div className="relative inline-flex p-3 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors w-fit">
                <feature.icon className="h-6 w-6 text-primary" />
                <div className="absolute inset-0 blur-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="flex-grow text-sm leading-relaxed text-muted-foreground sm:text-base">{feature.description}</p>
              <Link href="/features" className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80 group/link">
                Learn More
                <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </Card>
          ))}
        </div>

        <div className="mt-14 text-center sm:mt-16">
          <Button variant="hero" size="lg" className="group w-full sm:w-auto" asChild>
            <Link href="/auth/signup">
              Start Growing Today
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">Join 500+ founders already seeing results</p>
        </div>
      </div>
    </section>
  );
};

export default Features;