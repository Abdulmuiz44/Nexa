"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Activity, Link as LinkIcon, Zap, Calendar, TrendingUp } from "lucide-react";

interface AnalyticsSummary {
  summary?: {
    overall?: { impressions?: number; engagements?: number; avgEngagementRate?: number | null };
  };
}

interface LogsResponse { logs?: Array<{ id: string; timestamp: string; type: string; message: string }>; }

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<{ balance: number; lowBalance: boolean } | null>(null);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [connectCount, setConnectCount] = useState<number>(0);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<LogsResponse["logs"]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const nowIso = new Date().toISOString();
        const [wRes, sRes, aRes, lRes, cRes] = await Promise.all([
          fetch('/api/credits/me'),
          fetch(`/api/posts/scheduled?status=pending&from=${encodeURIComponent(nowIso)}&countOnly=1`),
          fetch('/api/analytics/summary?timeframe=month'),
          fetch('/api/logs'),
          fetch('/api/connectors').catch(() => null),
        ]);
        if (wRes?.ok) setCredits(await wRes.json());
        if (sRes?.ok) { const d = await sRes.json(); setScheduledCount(Number(d?.count || 0)); }
        if (aRes?.ok) setAnalytics(await aRes.json());
        if (lRes?.ok) { const d = await lRes.json(); setLogs(d?.logs || []); }
        if (cRes && cRes.ok) { const d = await cRes.json(); const count = Array.isArray(d) ? d.length : Number(d?.count || d?.connected?.length || 0); setConnectCount(Number.isFinite(count) ? count : 0); }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const impressions = useMemo(() => Number(analytics?.summary?.overall?.impressions ?? 0), [analytics]);
  const engagements = useMemo(() => Number(analytics?.summary?.overall?.engagements ?? 0), [analytics]);
  const avgRate = useMemo(() => {
    const v = analytics?.summary?.overall?.avgEngagementRate;
    return Number.isFinite(Number(v)) ? Number(v) : 0;
  }, [analytics]);

  const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Overview of your agent performance and account</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/dashboard/campaigns">New Campaign</Link></Button>
            <Button asChild><Link href="/chat">Open Chat</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Credits</div>
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold">{credits ? fmt(credits.balance) : (loading ? '—' : '0')}</div>
            <div className="text-xs text-muted-foreground">Remaining this month</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Scheduled</div>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">{loading ? '—' : scheduledCount}</div>
            <div className="text-xs text-muted-foreground">Pending posts</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Impressions</div>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold">{fmt(impressions)}</div>
            <div className="text-xs text-muted-foreground">Last 30 days</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">Engagement rate</div>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold">{avgRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Last 30 days</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs && logs.length > 0 ? logs.slice(0, 10).map((l) => (
                  <div key={l.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{l.message}</div>
                      <div className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</div>
                    </div>
                    <span className="ml-3 shrink-0 text-xs rounded-full bg-accent/40 px-2 py-1">{l.type}</span>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground">{loading ? 'Loading...' : 'No recent activity'}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{loading ? '—' : connectCount}</div>
              <p className="text-sm text-muted-foreground mb-4">Accounts connected to Nexa</p>
              <div className="flex gap-2">
                <Button asChild variant="outline"><Link href="/dashboard/connections">Manage Connections</Link></Button>
                <Button asChild><Link href="/dashboard/analytics">View Analytics</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
