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
<section className="py-24 bg-secondary/30">
<div className="container mx-auto px-4 sm:px-6">
<div className="text-center mb-16">
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
  <span className="text-sm font-semibold text-primary">⭐ 4.9/5 Average Rating</span>
</div>
<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">Loved by Founders & Marketers</h2>
  <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
    Don't just take our word for it. Here's what our users are saying.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 hover:scale-105 transition-all duration-300 group hover:shadow-neon opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 0.2}s` }}>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-lg mb-6 font-light">{testimonial.quote}</p>
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

        <div className="text-center mt-16">
          <Button variant="hero" size="lg" className="group" asChild>
            <Link href="/pricing">
              Join the Success Stories
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Start your 14-day free trial today</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
