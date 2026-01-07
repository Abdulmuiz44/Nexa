"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Plus, Crown, Zap, TrendingDown, TrendingUp, Activity, RefreshCw } from "lucide-react";
import { CREDIT_VALUE_USD, MINIMUM_PURCHASE_CREDITS } from "@/lib/utils/credits";

export default function BillingPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [buying, setBuying] = useState(false);
  const [amountUSD, setAmountUSD] = useState<string>("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<string>("month");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/credits/me');
      const data = await res.json();
      if (res.ok) setBalance(Number(data.balance || 0));
      const tr = await fetch('/api/credits/transactions').then(r => r.json()).catch(() => ({ transactions: [] }));
      setTransactions(tr.transactions || []);
    } catch {}
  };

  const loadUsageStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/credits/usage?timeframe=${timeframe}`);
      const data = await res.json();
      if (res.ok) {
        setUsageStats(data.usageStats);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (status === 'authenticated') load(); }, [status]);
  useEffect(() => { if (status === 'authenticated') loadUsageStats(); }, [status, timeframe]);

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
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Billing & Credits</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your credits and subscription plan</p>
        </div>

        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors mb-8">
          <div className="pb-4 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500" /> Current Plan</h3>
          </div>
          <div>
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

        {/* Credit Usage Statistics */}
        <Card className="p-6 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Credit Usage
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUsageStats}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usageStats ? (
              <div className="space-y-6">
                {/* Usage Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{usageStats.totalSpent.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Credits Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{usageStats.totalEarned.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Credits Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {usageStats.byType ? Object.keys(usageStats.byType).length : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Usage Types</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {usageStats.byDay ? Object.keys(usageStats.byDay).length : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Days</div>
                  </div>
                </div>

                {/* Usage by Type */}
                {usageStats.byType && Object.keys(usageStats.byType).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Usage by Type</h4>
                    <div className="space-y-2">
                      {Object.entries(usageStats.byType).map(([type, credits]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                          <span className="font-medium">{Number(credits).toFixed(2)} credits</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Usage */}
                {usageStats.recentUsage && usageStats.recentUsage.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Recent Usage</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {usageStats.recentUsage.map((usage: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="text-sm">
                            <div className="font-medium capitalize">{usage.type.replace('_', ' ')}</div>
                            <div className="text-muted-foreground text-xs">
                              {new Date(usage.date).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-500">-{usage.credits.toFixed(2)}</div>
                            {usage.description && (
                              <div className="text-xs text-muted-foreground">{usage.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usage Insights */}
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Usage Insights
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• You've used {usageStats.totalSpent.toFixed(2)} credits {timeframe === 'month' ? 'this month' : timeframe === 'week' ? 'this week' : 'this year'}</p>
                    {usageStats.totalSpent > balance * 0.8 && (
                      <p className="text-orange-600">⚠️ You're using credits quickly. Consider topping up soon.</p>
                    )}
                    {usageStats.byType && Object.keys(usageStats.byType).includes('agent_chat') && (
                      <p>• Most usage comes from AI chat interactions</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Loading Usage Statistics</h3>
                <p className="text-muted-foreground">Fetching your credit usage data...</p>
              </div>
            )}
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
                {(!transactions || transactions.length === 0) && <div className="text-sm text-muted-foreground">No transactions yet</div>}
                {transactions && transactions.map((t) => (
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
