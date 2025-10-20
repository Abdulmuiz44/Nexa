import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import TrustedBy from '@/components/TrustedBy';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <Testimonials />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background to-secondary/20">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      <div className="container relative z-10 px-4 sm:px-6 text-center mx-auto flex flex-col items-center">
      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-success/10 border border-success/20 mb-8 backdrop-blur-sm animate-pulse">
      <span className="text-sm font-semibold text-success">🚀 Join 500+ Founders Already Growing</span>
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
      Ready to Scale Your Growth?
      </h2>
      <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
      Join founders who replaced their social media team with Nexa —
      and never looked back.
      </p>

      {/* Social Proof Numbers */}
      <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mb-8">
      <div>
      <div className="text-2xl font-bold text-primary">500+</div>
        <div className="text-sm text-muted-foreground">Active Users</div>
        </div>
          <div>
              <div className="text-2xl font-bold text-primary">10M+</div>
              <div className="text-sm text-muted-foreground">Interactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="group animate-pulse hover:animate-none" asChild>
              <Link href="/pricing">
                Start Your AI Agent
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="hover:scale-105 transition-transform" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;