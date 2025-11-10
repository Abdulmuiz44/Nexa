"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

function PaymentCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'success'|'failed'>('pending');
  const [message, setMessage] = useState<string>('Verifying your payment...');
  const [credited, setCredited] = useState<number>(0);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const txId = params.get('transaction_id');
    const txRef = params.get('tx_ref');
    if (!txId || !txRef) {
      setStatus('failed');
      setMessage('Invalid callback.');
      return;
    }
    const run = async () => {
      try {
        const res = await fetch(`/api/credits/verify?transaction_id=${encodeURIComponent(txId)}&tx_ref=${encodeURIComponent(txRef)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setCredited(Number(data?.credited || 0));
          if (typeof data?.balance === 'number') setBalance(Number(data.balance));
          setMessage('Payment verified. Your credits have been added.');
        } else {
          setStatus('failed');
          setMessage(data?.error || 'Payment verification failed.');
        }
      } catch {
        setStatus('failed');
        setMessage('Payment verification failed.');
      }
    };
    run();
  }, [params]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Payment {status === 'success' ? 'Successful' : status === 'failed' ? 'Failed' : 'Processing'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">{message}</p>
          {status === 'success' && (
            <div className="mb-4 text-sm">
              <div>Credited: <span className="font-medium">{credited.toFixed(2)}</span> credits</div>
              {balance !== null && (
                <div>New balance: <span className="font-medium">{balance.toFixed(2)}</span> credits</div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => router.push('/dashboard/billing')}>Go to Billing</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Processing Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}