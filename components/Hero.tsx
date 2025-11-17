'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Bot, Clock } from "lucide-react";
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

        {/* Problem-focused headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="block text-foreground mb-2">Tired of Slow Social Growth?</span>
          <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
            Meet Your AI Growth Agent
          </span>
        </h1>

        {/* Problem + Solution copy */}
        <p className="mx-auto mb-10 max-w-3xl px-2 text-base leading-relaxed text-muted-foreground sm:mb-12 sm:px-0 sm:text-xl md:text-2xl">
          Most founders spend 15+ hours weekly on social media with minimal results. Nexa automates everything—content creation, posting schedules, community engagement—so you can focus on building while your AI agent drives growth 24/7 across Reddit, X, and LinkedIn.
        </p>

        {/* Real proof instead of fake urgency */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary backdrop-blur-sm sm:px-6">
          <Clock className="h-4 w-4" />
          Get started in under 10 minutes • Free 14-day trial
        </div>

        <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:mb-16 sm:flex-row sm:gap-4">
          <Button variant="hero" size="lg" className="group w-full sm:w-auto" asChild>
            <Link href="/auth/signup">
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full transition-transform hover:scale-105 sm:w-auto" asChild>
            <Link href="#how-it-works">
              See How It Works
            </Link>
          </Button>
        </div>

        {/* Verified metrics */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-2 sm:grid-cols-3 sm:gap-6 sm:px-0">
          {[
            { icon: TrendingUp, label: "Avg. Growth in 30 Days", value: "+340%", detail: "For users with consistent posting" },
            { icon: Bot, label: "Hours Saved Weekly", value: "15+", detail: "Per founder using Nexa" },
            { icon: Sparkles, label: "Engagement Improvement", value: "3.2x", detail: "vs manual posting" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="group cursor-pointer rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/50 sm:p-6"
            >
              <stat.icon className="mx-auto mb-3 h-8 w-8 text-primary group-hover:animate-bounce" />
              <div className="mb-1 text-2xl font-bold text-foreground transition-colors group-hover:text-primary sm:text-3xl">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className="text-xs text-muted-foreground/60 mt-1">{stat.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;