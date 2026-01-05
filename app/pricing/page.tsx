'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import PricingCard from "@/components/PricingCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const pricingPlans = [
{
title: "Growth",
planId: "growth",
price: 49,
tagline: "Hire your first AI growth assistant.",
period: "/month",
features: [
"1 AI tool/project",
"Unlimited posts (Reddit + X)",
"AI Growth Agent (auto-replies & engagement)",
"Smart scheduling (best times to post)",
"Content variations & A/B testing",
"Campaign mode (launches, feature promos)",
"Full analytics dashboard",
"Weekly AI Growth Report",
"Priority email/chat support",
],
},
{
title: "Scale",
planId: "scale",
price: 149,
tagline: "Run campaigns like a full-time growth team.",
period: "/month",
features: [
"Up to 5 AI tools/projects",
"Autonomous multi-agent campaigns (different personas)",
"Platforms: Reddit, X, Product Hunt, Indie Hackers",
"Advanced analytics (sentiment, post performance, funnel tracking)",
"Smart targeting (trending hashtags/subreddits)",
"Campaign templates & automation library",
"White-label PDF/Excel reports",
"Priority human + AI success manager",
"Early access to new features",
],
highlighted: true,
},
{
title: "Enterprise",
planId: "enterprise",
price: 499,
tagline: "Your entire AI growth department in the cloud.",
period: "/month",
features: [
"Unlimited AI tools/projects",
"Dedicated private Nexa instance",
"Custom integrations (LinkedIn, Slack, CRM, Webhooks)",
"Multi-agent orchestration (custom personas + AI brand tone)",
"Dedicated success manager & quarterly strategy sessions",
"White-label branding (own logo/domain)",
"API access + advanced analytics exports",
"99.9% uptime SLA",
],
},
];

const Pricing = () => {
const [loading, setLoading] = useState(false);

const handlePlanSelect = async (planId: string) => {
    setLoading(true);
    try {
        const plan = pricingPlans.find(p => p.planId === planId);
        if (!plan) return;

        const response = await fetch('/api/subscriptions/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, amount: plan.price }),
        });

        const data = await response.json();
        if (data.paymentLink) {
            window.location.href = data.paymentLink;
        } else {
            alert('Error initializing payment. Please try again.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Error initializing payment. Please try again.');
    } finally {
        setLoading(false);
    }
};

const handleContactSales = () => {
    window.location.href = 'mailto:support@nexaagent.app?subject=Enterprise%20Plan%20Inquiry';
};

return (
  <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
<Navbar />

<main className="pt-24 pb-16 flex flex-col items-center">
<div className="container px-6">
<Button variant="ghost" className="mb-8" asChild>
<Link href="/onboarding">
<ArrowLeft className="mr-2" />
Back to Onboarding
</Link>
</Button>

    <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Simple,{" "}
              <span className="">Transparent Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your growth goals. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {pricingPlans.map((plan, idx) => (
              <PricingCard key={idx} {...plan} onSelect={handlePlanSelect} />
            ))}
          </div>

          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Need a custom solution or have questions?
            </p>
            <Button variant="outline" size="lg" onClick={handleContactSales} disabled={loading}>
              {loading ? 'Loading...' : 'Contact Sales'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
