'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';

interface AdminOverview {
  totalUsers: number;
  totalCreditsInCirculation: number;
  totalCreditsPurchased: number;
  totalCreditsSpent: number;
  averageUserBalance: number;
  topSpendingUsers: Array<{
    user_id: string;
    email: string;
    total_spent: number;
  }>;
  recentTransactions: any[];
  dailyUsage: any[];
}

interface AdminCreditOverviewCardProps {
  overview: AdminOverview;
}

export function AdminCreditOverviewCard({ overview }: AdminCreditOverviewCardProps) {
  const purchaseToSpendRatio = overview.totalCreditsPurchased > 0
    ? (overview.totalCreditsSpent / overview.totalCreditsPurchased) * 100
    : 0;

  const utilizationRate = overview.totalCreditsPurchased > 0
    ? (overview.totalCreditsSpent / (overview.totalCreditsPurchased + overview.totalCreditsInCirculation)) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Users */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {overview.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Registered users
          </p>
        </CardContent>
      </Card>

      {/* Credits in Circulation */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credits in Circulation</CardTitle>
          <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {overview.totalCreditsInCirculation.toLocaleString()}
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Available credits
          </p>
        </CardContent>
      </Card>

      {/* Total Purchased */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {overview.totalCreditsPurchased.toLocaleString()}
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Credits bought
          </p>
        </CardContent>
      </Card>

      {/* Total Spent */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {overview.totalCreditsSpent.toLocaleString()}
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            Credits used
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Additional metrics cards below the main grid
export function AdminCreditMetricsCards({ overview }: AdminCreditOverviewCardProps) {
  const purchaseToSpendRatio = overview.totalCreditsPurchased > 0
    ? (overview.totalCreditsSpent / overview.totalCreditsPurchased) * 100
    : 0;

  const utilizationRate = overview.totalCreditsPurchased > 0
    ? (overview.totalCreditsSpent / (overview.totalCreditsPurchased + overview.totalCreditsInCirculation)) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Average Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average User Balance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {overview.averageUserBalance.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Credits per user
          </p>
        </CardContent>
      </Card>

      {/* Utilization Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {utilizationRate.toFixed(1)}%
          </div>
          <Progress value={utilizationRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Of total credits
          </p>
        </CardContent>
      </Card>

      {/* Purchase to Spend Ratio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spend Efficiency</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {purchaseToSpendRatio.toFixed(1)}%
          </div>
          <Progress value={purchaseToSpendRatio} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Purchased vs spent
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
