import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

const testimonials = [
  {
    quote: "Nexa reduced my weekly social media work from 15 hours to just 2. We went from 5K followers to 50K in 6 months with better engagement.",
    name: 'Sarah Johnson',
    title: 'Founder, CloudSync',
    avatar: '',
    rating: 5,
    metric: '+900% follower growth',
    timeframe: 'in 6 months'
  },
  {
    quote: "The AI truly understands our brand voice. Our LinkedIn engagement rate jumped 3.2x. It's like having a full-time growth marketer that never sleeps.",
    name: 'Michael Chen',
    title: 'CMO, TechFlow Inc.',
    avatar: '',
    rating: 5,
    metric: '3.2x engagement increase',
    timeframe: 'in 60 days'
  },
  {
    quote: "What impressed us most is the brand safety. Every post aligns with our values. We gained 2,400 qualified leads through Reddit engagement—something we couldn't do manually.",
    name: 'Jessica Rodriguez',
    title: 'Growth Lead, BuildStack',
    avatar: '',
    rating: 5,
    metric: '2,400+ qualified leads',
    timeframe: 'in 90 days'
  },
];

const Testimonials = () => {
  return (
    <section className="bg-secondary/30 py-20 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-14 text-center sm:mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-semibold text-primary">⭐ 4.9/5 Average Rating • 500+ Active Users</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Real Results from Real Founders</h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
            See verified metrics from companies using Nexa to accelerate their growth.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 md:gap-8">
          {testimonials.map((testimonial, idx) => (
            <Card
              key={idx}
              className="group h-full rounded-3xl border-border bg-card/50 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-primary/50 hover:shadow-neon opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              <CardContent className="flex h-full flex-col justify-between p-6">
                {/* Rating */}
                <div className="mb-4 flex">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>

                {/* Quote */}
                <p className="mb-6 text-base font-light leading-relaxed text-foreground sm:text-lg">{testimonial.quote}</p>

                {/* Metric Badge */}
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 w-fit">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">{testimonial.metric}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.timeframe}</p>
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14 text-center sm:mt-16">
          <Button variant="hero" size="lg" className="group w-full sm:w-auto" asChild>
            <Link href="/auth/signup">
              Start Your Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">14 days free • No credit card required • Cancel anytime</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
