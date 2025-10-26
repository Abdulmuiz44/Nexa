'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, CreditCard, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { creditService, CreditUsageAnalytics } from '@/src/services/creditService';

interface CreditAnalyticsCardProps {
  userId: string;
}

export function CreditAnalyticsCard({ userId }: CreditAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<CreditUsageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [topOperations, setTopOperations] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const data = await creditService.getCreditUsageAnalytics(userId, days);
      setAnalytics(data);

      // Calculate top operations
      const operations: Record<string, number> = {};
      data.forEach(day => {
        Object.entries(day.operation_breakdown || {}).forEach(([op, count]) => {
          operations[op] = (operations[op] || 0) + (count as number);
        });
      });
      setTopOperations(operations);
    } catch (error) {
      console.error('Error loading credit analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = analytics.reduce((sum, day) => sum + day.total_credits_spent, 0);
  const totalPurchased = analytics.reduce((sum, day) => sum + day.credits_purchased, 0);

  const sortedOperations = Object.entries(topOperations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Credit Analytics
        </CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-destructive/10 rounded-lg">
            <TrendingDown className="h-6 w-6 text-destructive mx-auto mb-2" />
            <div className="text-2xl font-bold text-destructive">{totalSpent}</div>
            <div className="text-sm text-muted-foreground">Credits Spent</div>
          </div>
          <div className="text-center p-4 bg-success/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-success">{totalPurchased}</div>
            <div className="text-sm text-muted-foreground">Credits Purchased</div>
          </div>
        </div>

        {/* Daily Usage Chart (Simple bar chart) */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Usage (Last {timeRange} days)
          </h4>
          <div className="space-y-2">
            {analytics.slice(0, 7).map((day) => (
              <div key={day.date.toString()} className="flex items-center gap-3">
                <div className="w-16 text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min((day.total_credits_spent / Math.max(totalSpent / analytics.length, 1)) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="w-12 text-xs text-right">
                  {day.total_credits_spent}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Operations */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Top Operations
          </h4>
          <div className="space-y-2">
            {sortedOperations.map(([operation, count]) => (
              <div key={operation} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                <span className="text-sm capitalize">
                  {operation.replace(/_/g, ' ').toLowerCase()}
                </span>
                <Badge variant="secondary">{count} credits</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/dashboard?tab=credits', '_self')}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
