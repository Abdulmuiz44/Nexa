'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Bot } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative py-20 sm:py-32 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="container relative z-10 px-4 sm:px-6 py-20 sm:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-primary/20 mb-8 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-primary animate-pulse-glow" />
          <span className="text-sm text-muted-foreground">Your 24/7 AI Growth Team</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
        <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
        Autonomous AI
        </span>
        <br />
        Growth Agent
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed px-4 sm:px-0">
        Nexa promotes your brand on Reddit, X, and LinkedIn — creating content,
        posting, replying, and driving targeted growth while you focus on your product.
        </p>

        {/* Urgency Element */}
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-destructive/10 border border-destructive/20 mb-8 backdrop-blur-sm animate-pulse">
        <span className="text-sm font-semibold text-destructive">⚡ Limited Beta Access - Only 50 spots left!</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
        <Button variant="hero" size="lg" className="group animate-bounce hover:animate-none" asChild>
          <Link href="/pricing">
          Claim Your Spot
        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
        </Button>
          <Button variant="outline" size="lg" className="hover:scale-105 transition-transform" asChild>
            <Link href="#features">
              Learn More
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4 sm:px-0">
        {[
        { icon: TrendingUp, label: "Avg. Monthly Growth", value: "+340%" },
        { icon: Bot, label: "Daily Social Touches", value: "1,000+" },
        { icon: Sparkles, label: "Engagement Rate", value: "24%" },
        ].map((stat, idx) => (
        <div
        key={idx}
        className="p-6 rounded-xl bg-card/50 border border-border backdrop-blur-sm hover:border-primary/50 hover:scale-105 transition-all duration-300 group cursor-pointer"
        >
        <stat.icon className="h-8 w-8 text-primary mx-auto mb-3 group-hover:animate-bounce" />
        <div className="text-3xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{stat.value}</div>
        <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
        ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;