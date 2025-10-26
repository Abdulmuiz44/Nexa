'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AdminCreditOverviewCard } from '@/src/components/AdminCreditOverviewCard';
import { AdminTransactionTable } from '@/src/components/AdminTransactionTable';
import { CreditAdjustmentModal } from '@/src/components/CreditAdjustmentModal';

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

export default function AdminCreditsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    checkAdminAccess();
  }, [session, status]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/credits/overview');
      if (response.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setOverview(data.data);
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAdjustment = (user: any) => {
    setSelectedUser(user);
    setAdjustmentModalOpen(true);
  };

  const handleAdjustmentComplete = () => {
    setAdjustmentModalOpen(false);
    setSelectedUser(null);
    // Refresh overview data
    checkAdminAccess();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Credit Management</h1>
                <p className="text-muted-foreground">Monitor and manage platform credit usage</p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Shield className="h-3 w-3 mr-1" />
              Admin Access
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {overview && <AdminCreditOverviewCard overview={overview} />}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Credit Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by email, name, or ID..."
                      className="pl-10"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="low_balance">Low Balance</SelectItem>
                      <SelectItem value="high_spenders">High Spenders</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {/* User list will be populated by a separate component */}
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>User management interface coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <AdminTransactionTable />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Credit Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics dashboard coming soon</p>
                  <p className="text-sm">Including usage trends, revenue metrics, and predictive insights</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Credit Adjustment Modal */}
      <CreditAdjustmentModal
        isOpen={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        user={selectedUser}
        onComplete={handleAdjustmentComplete}
      />
    </div>
  );
}
