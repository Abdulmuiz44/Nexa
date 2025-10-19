import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-background">
        <div className="container relative z-10 px-6 text-center mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Scale Your Growth?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join founders who replaced their social media team with Nexa — 
            and never looked back.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="group" asChild>
              <Link href="/dashboard">
                Start Your AI Agent
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;