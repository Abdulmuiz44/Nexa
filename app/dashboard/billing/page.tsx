'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { plans, creditPrices } from '@/lib/pricingConfig';

export default function BillingPage() {
  const [credits, setCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [history, setHistory] = useState([]);
  const [autoTopUp, setAutoTopUp] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: wallet } = await supabase
      .from('credits_wallet')
      .select('balance')
      .eq('user_id', session.user.id)
      .single();

    setCredits(wallet?.balance || 0);

    const { data: user } = await supabase
      .from('users')
      .select('plan, auto_top_up')
      .eq('id', session.user.id)
      .single();

    setCurrentPlan(user?.plan || 'free');
    setAutoTopUp(user?.auto_top_up || false);

    const { data: hist } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    setHistory(hist || []);
  };

  const buyCredits = async (amount: number) => {
    const res = await fetch('/api/credits/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = data.paymentUrl;
    } else {
      alert(data.error);
    }
  };

  const subscribe = async (plan: string) => {
    // For now, placeholder - integrate with Flutterwave subscription
    alert(`Subscribe to ${plan}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Billing</h1>
      <div className="mb-8">
        <h2 className="text-xl mb-2">Credits</h2>
        <p>Balance: {credits}</p>
        <label>
          <input
            type="checkbox"
            checked={autoTopUp}
            onChange={(e) => {
              setAutoTopUp(e.target.checked);
              supabase.from('users').update({ auto_top_up: e.target.checked }).eq('id', session.user.id);
            }}
          />
          Enable Auto Top-Up
        </label>
        <div className="mt-4">
          {Object.entries(creditPrices).map(([cred, price]) => (
            <button
              key={cred}
              onClick={() => buyCredits(Number(cred))}
              className="bg-blue-500 text-white p-2 mr-2"
            >
              Buy {cred} credits for ${price}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-xl mb-2">Subscription Plans</h2>
        <p>Current Plan: {currentPlan}</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {Object.entries(plans).map(([key, plan]) => (
            <div key={key} className="border p-4">
              <h3>{plan.name}</h3>
              <p>${plan.price}/mo</p>
              <p>{plan.credits} credits</p>
              <ul>
                {plan.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <button
                onClick={() => subscribe(key)}
                disabled={key === currentPlan}
                className="bg-green-500 text-white p-2 mt-2"
              >
                {key === currentPlan ? 'Current' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl mb-2">Purchase History</h2>
        <ul>
          {history.map((h: any) => (
            <li key={h.id}>{h.amount_usd} USD - {h.credits_issued} credits - {h.status}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
