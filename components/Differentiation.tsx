import React from 'react';
import { Card } from './ui/card';
import { CheckCircle2, Lock, Zap, BarChart3, Shield, MessageSquare } from 'lucide-react';

const differentiators = [
  {
    icon: Shield,
    title: 'Brand-Safe by Default',
    description: 'Every post is checked against your brand guidelines and values before posting. Set custom rules and approval workflows. No more brand damage from automation gone wrong.',
  },
  {
    icon: Zap,
    title: 'Cross-Platform Speed',
    description: 'Post simultaneously to Reddit, X, LinkedIn, and more. Our Composio integration handles all platform APIs so you don\'t need separate tools for each channel.',
  },
  {
    icon: Lock,
    title: 'No Password Sharing',
    description: 'OAuth 2.0 authentication means you never give us your passwords. Your accounts remain in your control. Revoke access anytime without friction.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track every post\'s performance across platforms in one dashboard. See which content drives engagement, leads, and revenue. Adjust strategy in real-time.',
  },
  {
    icon: MessageSquare,
    title: 'Smart Engagement Engine',
    description: 'Not just posting—Nexa replies to comments, mentions, and relevant discussions in your voice. Builds real community relationships at scale.',
  },
  {
    icon: CheckCircle2,
    title: 'Manual Approval Mode',
    description: 'Don\'t want to go fully autonomous? Review and edit every post before it goes live. Perfect for high-stakes content or brand-sensitive campaigns.',
  },
];

const Differentiation = () => {
  return (
    <section className="relative py-20 sm:py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/20 via-background to-background" />
      
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14 text-center sm:mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-semibold text-primary">Why Nexa Stands Out</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Built for Founders Who Care About Quality Growth
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Most AI tools spray and pray. Nexa is designed with safety, control, and results in mind.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={idx}
                className="group rounded-3xl border-border bg-card/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-neon sm:p-8"
              >
                <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Comparison hint */}
        <div className="mt-14 rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center sm:mt-16 sm:p-8">
          <h3 className="text-lg font-semibold">Want to see how Nexa compares to other tools?</h3>
          <p className="mt-2 text-muted-foreground">
            Check out our detailed{' '}
            <a href="#" className="text-primary font-semibold hover:underline">
              comparison guide
            </a>{' '}
            (coming soon)
          </p>
        </div>
      </div>
    </section>
  );
};

export default Differentiation;
