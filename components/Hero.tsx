'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Bot } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative flex items-center justify-center overflow-hidden py-16 sm:py-28">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="container relative z-10 px-4 py-16 text-center sm:px-6 sm:py-28">
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

        <p className="mx-auto mb-10 max-w-3xl px-2 text-base leading-relaxed text-muted-foreground sm:mb-12 sm:px-0 sm:text-xl md:text-2xl">
        Nexa promotes your brand on Reddit, X, and LinkedIn — creating content,
        posting, replying, and driving targeted growth while you focus on your product.
        </p>

        {/* Urgency Element */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-5 py-3 text-sm font-semibold text-destructive backdrop-blur-sm sm:px-6">
        ⚡ Limited Beta Access - Only 50 spots left!
        </div>

        <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:mb-16 sm:flex-row sm:gap-4">
        <Button variant="hero" size="lg" className="group w-full sm:w-auto md:animate-bounce" asChild>
          <Link href="/auth/signup">
          Claim Your Spot
        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
        </Button>
          <Button variant="outline" size="lg" className="w-full transition-transform hover:scale-105 sm:w-auto" asChild>
            <Link href="/auth/signup">
              Start Free Trial
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-2 sm:grid-cols-3 sm:gap-6 sm:px-0">
        {[
        { icon: TrendingUp, label: "Avg. Monthly Growth", value: "+340%" },
        { icon: Bot, label: "Daily Social Touches", value: "1,000+" },
        { icon: Sparkles, label: "Engagement Rate", value: "24%" },
        ].map((stat, idx) => (
        <div
        key={idx}
        className="group cursor-pointer rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/50 sm:p-6"
        >
        <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary group-hover:animate-bounce" />
        <div className="mb-1 text-2xl font-bold text-foreground transition-colors group-hover:text-primary sm:text-3xl">{stat.value}</div>
        <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
        ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;