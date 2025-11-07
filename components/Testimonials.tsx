import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

const testimonials = [
  {
    quote: '"Nexa has been a game-changer for our marketing. We went from spending hours on content creation to having a fully autonomous agent that gets real results."',
    name: 'Sarah Johnson',
    title: 'Founder of SaaS Co.',
    avatar: '/placeholder-user.jpg',
    rating: 5,
  },
  {
    quote: '"I was skeptical at first, but the AI agent is incredibly smart. It understands our brand and engages with our community better than most humans."',
    name: 'Michael Chen',
    title: 'CMO at Tech Startup',
    avatar: '/placeholder.jpg',
    rating: 5,
  },
  {
    quote: '"The best part is the analytics. I can see exactly how the AI is contributing to our growth, all in one dashboard. It\'s like having a full-time growth hacker on the team."',
    name: 'Jessica Rodriguez',
    title: 'Indie Hacker',
    avatar: '/placeholder-user.jpg',
    rating: 5,
  },
];

const Testimonials = () => {
return (
<section className="bg-secondary/30 py-20 sm:py-24">
<div className="container mx-auto px-4 sm:px-6">
<div className="mb-14 text-center sm:mb-16">
<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-sm">
  <span className="text-sm font-semibold text-primary">⭐ 4.9/5 Average Rating</span>
</div>
<h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Loved by Founders & Marketers</h2>
  <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
    Don't just take our word for it. Here's what our users are saying.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 md:gap-8">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="group h-full rounded-3xl border-border bg-card/50 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-primary/50 hover:shadow-neon opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 0.2}s` }}>
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="mb-4 flex">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="mb-6 text-base font-light leading-relaxed text-foreground sm:text-lg">{testimonial.quote}</p>
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
              Join the Success Stories
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">Start your 14-day free trial today</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
