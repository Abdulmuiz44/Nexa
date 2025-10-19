import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star } from 'lucide-react';

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
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Founders & Marketers</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our users are saying.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-neon">
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
      </div>
    </section>
  );
};

export default Testimonials;
