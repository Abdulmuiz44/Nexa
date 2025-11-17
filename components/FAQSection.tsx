"use client";

import React, { useState } from 'react';
import { Card } from './ui/card';
import { ChevronDown, Shield, Lock, Brain, Zap } from 'lucide-react';

const faqs = [
  {
    question: 'How does Nexa keep my brand safe?',
    answer: 'Nexa uses advanced content guardrails and brand safety filters. Every post is reviewed against your brand guidelines before posting. You can set custom rules, review queues, and approval workflows. We never post anything that doesn\'t align with your voice.',
    icon: Shield,
  },
  {
    question: 'Is my data and authentication secure?',
    answer: 'Yes. We use OAuth 2.0 for platform connections—you never share passwords with us. All credentials are encrypted at rest and in transit. We\'re SOC 2 compliant and conduct regular security audits. Your data is never sold or shared.',
    icon: Lock,
  },
  {
    question: 'How long until I see results?',
    answer: 'Most users see initial engagement within 7 days and meaningful growth (followers, leads) within 30 days. The timeline depends on your niche, content consistency, and campaign setup. See our case studies for real examples.',
    icon: Zap,
  },
  {
    question: 'Does Nexa understand my specific product/niche?',
    answer: 'Yes. During onboarding, you define your brand voice, target audience, and content pillars. Nexa\'s AI learns from your past successful content and continuously adapts. You can also review and edit generated content before posting.',
    icon: Brain,
  },
  {
    question: 'Can I control what Nexa posts?',
    answer: 'Completely. You can set approval modes (auto-post, review queue, or manual approval), define content types, set posting schedules, and customize engagement responses. You maintain full control over your brand.',
    icon: Zap,
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer: 'No penalties. You keep all historical data, analytics, and posts. Your scheduled posts are paused. You can resume anytime. We want to earn your subscription every month.',
    icon: Shield,
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14 max-w-2xl sm:mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-semibold text-primary">Common Questions</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Everything You Need to Know
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Clarity on security, brand safety, results, and how Nexa works with your workflow.
          </p>
        </div>

        {/* FAQs */}
        <div className="grid gap-4 sm:gap-6 max-w-3xl">
          {faqs.map((faq, idx) => {
            const IconComponent = faq.icon;
            const isOpen = openIndex === idx;
            return (
              <Card
                key={idx}
                className="group rounded-2xl border-border bg-card/50 overflow-hidden transition-all duration-300 cursor-pointer hover:border-primary/30"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <div className="flex items-start gap-4 p-6">
                  <div className="mt-1 inline-flex p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  <div className="flex-1">
                    <button className="flex w-full items-center justify-between text-left">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {faq.question}
                      </h3>
                      <ChevronDown 
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-4 text-base text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:mt-16 sm:p-8">
          <h3 className="text-xl font-semibold">Still have questions?</h3>
          <p className="mt-2 text-muted-foreground">
            Our team is here to help. Email us at{' '}
            <a href="mailto:support@nexa.ai" className="text-primary font-semibold hover:underline">
              support@nexa.ai
            </a>{' '}
            or reach out on Twitter.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
