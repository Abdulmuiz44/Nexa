"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Target, Users, Link as LinkIcon, Calendar, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface ROIMetrics {
  totalInvestment: number;
  totalRevenue: number;
  roi: number; // percentage
  paybackPeriod: number; // days
  customerAcquisitionCost: number;
  lifetimeValue: number;
  conversionRate: number;
  attributionData: {
    direct: number;
    social: number;
    organic: number;
  };
}

interface ROITrackingProps {
  userId: string;
}

export function ROITracking({ userId }: ROITrackingProps) {
  const [roiData, setRoiData] = useState<ROIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchROIData();
  }, [userId, timeframe]);

  const fetchROIData = async () => {
    try {
      const response = await fetch(`/api/analytics/roi?timeframe=${timeframe}`);
      const data = await response.json();
      if (data.roiData) {
        setRoiData(data.roiData);
      }
    } catch (error) {
      console.error('Failed to fetch ROI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getROIColor = (roi: number) => {
    if (roi >= 300) return 'text-green-600';
    if (roi >= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getROIStatus = (roi: number) => {
    if (roi >= 300) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (roi >= 100) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (roi >= 0) return { text: 'Breaking Even', color: 'bg-blue-100 text-blue-800' };
    return { text: 'Loss', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ROI Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roiData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ROI Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No ROI data available</h3>
            <p className="text-muted-foreground mb-4">
              Connect your analytics tools to track ROI from your social media campaigns.
            </p>
            <Button onClick={fetchROIData}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roiStatus = getROIStatus(roiData.roi);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ROI Tracking
          </CardTitle>
          <div className="flex gap-2">
            {(['month', 'quarter', 'year'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Track the return on investment from your social media campaigns
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main ROI Summary */}
        <div className="text-center p-6 bg-accent/20 rounded-lg">
          <div className="text-4xl font-bold mb-2">
            <span className={getROIColor(roiData.roi)}>{roiData.roi.toFixed(1)}%</span>
          </div>
          <Badge className={roiStatus.color}>
            {roiStatus.text} ROI
          </Badge>
          <div className="text-sm text-muted-foreground mt-2">
            Payback period: {roiData.paybackPeriod} days
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(roiData.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(roiData.customerAcquisitionCost)}
            </div>
            <div className="text-xs text-muted-foreground">CAC</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(roiData.lifetimeValue)}
            </div>
            <div className="text-xs text-muted-foreground">LTV</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">
              {roiData.conversionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Conversion Rate</div>
          </Card>
        </div>

        {/* Attribution Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Attribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              How different channels contribute to your revenue
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Direct Traffic</span>
                  <span>{roiData.attributionData.direct.toFixed(1)}%</span>
                </div>
                <Progress value={roiData.attributionData.direct} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Social Media</span>
                  <span>{roiData.attributionData.social.toFixed(1)}%</span>
                </div>
                <Progress value={roiData.attributionData.social} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Organic Search</span>
                  <span>{roiData.attributionData.organic.toFixed(1)}%</span>
                </div>
                <Progress value={roiData.attributionData.organic} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              ROI Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roiData.roi < 100 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Optimization Opportunity
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your social media campaigns are not yet profitable. Consider focusing on high-converting content
                    and optimizing your targeting to improve ROI.
                  </p>
                </div>
              )}

              {roiData.customerAcquisitionCost > roiData.lifetimeValue * 0.3 && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    High Customer Acquisition Cost
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Your CAC is {((roiData.customerAcquisitionCost / roiData.lifetimeValue) * 100).toFixed(0)}% of LTV.
                    Focus on improving conversion rates and reducing ad spend.
                  </p>
                </div>
              )}

              {roiData.attributionData.social > 50 && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Strong Social Performance
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {roiData.attributionData.social.toFixed(1)}% of your revenue comes from social media.
                    Consider increasing your social media budget for even better results.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
