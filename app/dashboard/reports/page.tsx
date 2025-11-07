"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?period=${timeRange}`);
        const data = await res.json();
        setReport(data.report || null);
      } catch (e) {
        console.error('Report fetch error', e);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [timeRange]);

  const platformPercentages = useMemo(() => {
    const pb = report?.platformBreakdown || {};
    const totalEng = Object.values(pb).reduce((sum: number, p: any) => sum + (p.engagement || 0), 0) || 0;
    const result: Record<string, number> = {};
    Object.entries(pb).forEach(([k, v]: any) => {
      result[k] = totalEng > 0 ? Math.round(((v.engagement || 0) / totalEng) * 1000) / 10 : 0;
    });
    return result;
  }, [report]);

  const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-2">Comprehensive performance reports and insights</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={async () => {
              const blob = new Blob([JSON.stringify(report || {}, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `report-${timeRange}d.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards (real) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Total Posts</div>
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {report ? `${report.summary.totalPosts}` : '—'}
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{report ? fmt(report.summary.totalPosts) : (loading ? '—' : '0')}</div>
            <div className="text-sm text-muted-foreground">This period</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Avg Engagement Rate</div>
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{report ? `${(report.summary.averageEngagementRate || 0).toFixed(1)}%` : (loading ? '—' : '0%')}</div>
            <div className="text-sm text-muted-foreground">Across platforms</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Total Engagement</div>
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{report ? fmt(report.summary.totalEngagement) : (loading ? '—' : '0')}</div>
            <div className="text-sm text-muted-foreground">This period</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Top Platform</div>
            </div>
            <div className="text-3xl font-bold mb-1 capitalize">{report ? (report.summary.topPerformingPlatform || '—') : (loading ? '—' : '—')}</div>
            <div className="text-sm text-muted-foreground">By post count</div>
          </Card>
        </div>

        {/* Platform Performance (real) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report?.platformBreakdown || {}).map(([platform, data]: any) => (
                  <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${platform === 'twitter' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                      <span className="font-medium capitalize">{platform}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{platformPercentages[platform] || 0}%</div>
                      <div className="text-sm text-muted-foreground">of total engagement</div>
                    </div>
                  </div>
                ))}
                {report && Object.keys(report.platformBreakdown || {}).length === 0 && (
                  <div className="text-sm text-muted-foreground">No data</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Content Type Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(report?.contentPerformance || {}).map(([label, v]: any) => (
                  <div key={label} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-muted"></div>
                      <span className="font-medium capitalize">{label.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{v.percentage}%</div>
                      <div className="text-sm text-muted-foreground">share</div>
                    </div>
                  </div>
                ))}
                {report && Object.keys(report.contentPerformance || {}).length === 0 && (
                  <div className="text-sm text-muted-foreground">No data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report generation info */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {report ? new Date(report.generatedAt).toLocaleString() : (loading ? 'Loading…' : '—')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
