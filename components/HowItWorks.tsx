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
    <section className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with your AI growth agent in three simple steps.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, idx) => (
            <Card key={idx} className="text-center bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-neon">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">{step.icon}</div>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="hero" size="lg" className="group" asChild>
            <Link href="/pricing">
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
