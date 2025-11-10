'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PaymentForm } from '@/components/payment-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

const pricingPlans = [
  {
    title: "Growth",
    planId: "growth",
    price: 49,
  },
  {
    title: "Scale",
    planId: "scale",
    price: 149,
  },
  {
    title: "Enterprise",
    planId: "enterprise",
    price: 499,
  },
];

const SubscribeForm = () => {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const selectedPlan = pricingPlans.find(p => p.planId === planId);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Plan not found.</p>
      </div>
    );
  }

  const handlePaymentSuccess = (reference: string) => {
    // Here you would typically update the user's subscription in your database
    // and then redirect to the dashboard.
    console.log('Payment successful:', reference);
    // router.push('/dashboard');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 flex flex-col items-center">
        <div className="container px-6">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Subscribe to {selectedPlan.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm
                campaignId="" // campaignId is not relevant here
                amount={selectedPlan.price}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

function SubscribePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscribeForm />
    </Suspense>
  );
}

export default SubscribePage;
