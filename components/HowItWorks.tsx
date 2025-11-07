import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Zap, Target, Bot, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

const steps = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: '1. Connect & Configure',
    description: 'Link your social media profiles, define your brand voice, and set your content pillars. Your AI gets to know your brand in minutes.',
  },
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: '2. Define Your Goals',
    description: 'Tell your AI agent what you want to achieve—whether it\'s lead generation, brand awareness, or community engagement. It will tailor its strategy accordingly.',
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: '3. Launch & Grow',
    description: 'Deploy your AI agent and watch it create content, engage with users, and grow your audience 24/7. Monitor its progress in your dashboard.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-secondary/40 py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-14 text-center sm:mb-16">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
            Get started with your AI growth agent in three simple steps.
          </p>
        </div>

        <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 md:gap-8 sm:mb-16">
          {steps.map((step, idx) => (
            <Card
              key={idx}
              className="group flex h-full flex-col items-center justify-between rounded-3xl border-border bg-card/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-primary/50 hover:shadow-neon"
            >
              <CardHeader>
                <div className="mx-auto mb-4 w-fit rounded-full bg-primary/10 p-4">{step.icon}</div>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg" className="group w-full sm:w-auto" asChild>
            <Link href="/auth/signup">
              Get Started Now
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
