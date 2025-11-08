"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Plus, Crown, Zap } from "lucide-react";
import { CREDIT_VALUE_USD, MINIMUM_PURCHASE_CREDITS } from "@/lib/utils/credits";

export default function BillingPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [buying, setBuying] = useState(false);
  const [amountUSD, setAmountUSD] = useState<string>("");
  const [transactions, setTransactions] = useState<any[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/credits/me');
      const data = await res.json();
      if (res.ok) setBalance(Number(data.balance || 0));
      const tr = await fetch('/api/credits/transactions').then(r => r.json()).catch(() => ({ transactions: [] }));
      setTransactions(tr.transactions || []);
    } catch {}
  };

  useEffect(() => { if (status === 'authenticated') load(); }, [status]);

  const minUSD = useMemo(() => MINIMUM_PURCHASE_CREDITS * CREDIT_VALUE_USD, []);

  const startCheckout = async () => {
    const amt = Number(amountUSD);
    if (!amt || amt <= 0) { toast({ title: 'Enter a valid amount', variant: 'destructive' }); return; }
    if (amt < minUSD) { toast({ title: `Minimum purchase is $${minUSD.toFixed(2)} (${MINIMUM_PURCHASE_CREDITS} credits)`, variant: 'destructive' }); return; }
    setBuying(true);
    try {
      const res = await fetch('/api/credits/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountUSD: amt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      window.open(data.link, '_blank');
      toast({ title: 'Checkout opened', description: 'Complete payment in the new tab. Credits will be added automatically.' });
    } catch (e: any) {
      toast({ title: 'Payment init failed', description: e?.message || 'Try again later', variant: 'destructive' });
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Billing & Credits</h1>
          <p className="text-muted-foreground mt-2">Manage your credits and subscription plan</p>
        </div>

        <Card className="p-6 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500" /> Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{(session?.user as any)?.subscriptionTier || 'Growth'}</h3>
                <p className="text-muted-foreground">Status: {(session?.user as any)?.subscriptionStatus || 'active'}</p>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credits used this month</span>
                <span>—</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /> Credit Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{balance.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground mb-4">Credits available</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={MINIMUM_PURCHASE_CREDITS * CREDIT_VALUE_USD} placeholder={`Min $${(MINIMUM_PURCHASE_CREDITS * CREDIT_VALUE_USD).toFixed(2)}`} value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)} />
                <Button className="min-w-[170px]" onClick={startCheckout} disabled={buying}>
                  <Plus className="mr-2 h-4 w-4" /> {buying ? 'Opening…' : 'Buy Credits'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-500" /> Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-auto pr-1">
                {transactions.length === 0 && <div className="text-sm text-muted-foreground">No transactions yet</div>}
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="text-sm">
                      <div className="font-medium capitalize">{String(t.tx_type).replace('_',' ')}</div>
                      <div className="text-muted-foreground text-xs">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{Number(t.credits).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{t.description || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
