import { SupabaseAdapter } from '@/src/lib/db/supabase-adapter';
import { creditService } from './creditService';

export interface BillingReport {
  id: string;
  user_id?: string;
  period_start: Date;
  period_end: Date;
  total_credits_spent: number;
  total_credits_purchased: number;
  total_credits_refunded: number;
  total_credits_earned: number;
  net_balance_change: number;
  report_type: 'user' | 'admin';
  report_json: any;
  email_sent: boolean;
  generated_at: Date;
}

export interface UserBillingSummary {
  period: {
    start: Date;
    end: Date;
  };
  credits: {
    spent: number;
    purchased: number;
    refunded: number;
    earned: number;
    net_change: number;
    current_balance: number;
  };
  operations: {
    top_operations: Array<{ operation: string; credits: number; count: number }>;
    total_operations: number;
  };
  financial: {
    revenue: number; // credits purchased * $0.10
    average_daily_spend: number;
  };
  trends: {
    vs_previous_month: {
      spent_change: number;
      purchased_change: number;
    };
    predictions: {
      next_month_spend: number;
      next_month_revenue: number;
    };
  };
}

export interface AdminBillingSummary {
  period: {
    start: Date;
    end: Date;
  };
  platform: {
    total_users: number;
    active_users: number; // users who spent credits this month
    new_users: number;
  };
  credits: {
    total_purchased: number;
    total_spent: number;
    total_refunded: number;
    total_earned: number;
    net_circulation_change: number;
    average_per_user: number;
  };
  financial: {
    total_revenue: number; // credits purchased * $0.10
    average_revenue_per_user: number;
    refund_rate: number;
  };
  top_users: Array<{
    user_id: string;
    email: string;
    credits_spent: number;
    operations_count: number;
  }>;
  trends: {
    vs_previous_month: {
      revenue_change: number;
      user_growth: number;
      engagement_change: number;
    };
    predictions: {
      next_month_revenue: number;
      projected_users: number;
    };
  };
}

class BillingService {
  private adapter: SupabaseAdapter;

  constructor() {
    this.adapter = new SupabaseAdapter();
  }

  // Generate monthly billing report for a specific user
  async generateUserReport(userId: string, periodStart?: Date, periodEnd?: Date): Promise<UserBillingSummary> {
    // Default to previous month if no period specified
    const now = new Date();
    const start = periodStart || new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = periodEnd || new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get credit transactions for the period
    const transactions = await this.adapter.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (transactions.error) {
      throw new Error(`Failed to fetch transactions: ${transactions.error.message}`);
    }

    const txData = transactions.data || [];

    // Aggregate transaction data
    const spent = txData.filter(tx => tx.tx_type === 'spend').reduce((sum, tx) => sum + tx.credits, 0);
    const purchased = txData.filter(tx => tx.tx_type === 'purchase').reduce((sum, tx) => sum + tx.credits, 0);
    const refunded = txData.filter(tx => tx.tx_type === 'refund').reduce((sum, tx) => sum + tx.credits, 0);
    const earned = txData.filter(tx => tx.tx_type === 'earn').reduce((sum, tx) => sum + tx.credits, 0);
    const net_change = earned + refunded - spent;

    // Get current balance
    const currentBalance = await creditService.getCreditBalance(userId);

    // Analyze operations
    const operationStats = new Map<string, { credits: number; count: number }>();
    txData.filter(tx => tx.tx_type === 'spend').forEach(tx => {
      const key = tx.operation_type || 'unknown';
      const existing = operationStats.get(key) || { credits: 0, count: 0 };
      operationStats.set(key, {
        credits: existing.credits + tx.credits,
        count: existing.count + 1
      });
    });

    const topOperations = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({ operation, ...stats }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 5);

    // Calculate financial metrics
    const revenue = purchased * 0.10; // $0.10 per credit
    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const averageDailySpend = spent / daysInPeriod;

    // Get previous month data for comparison
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevEnd = new Date(start.getFullYear(), start.getMonth() - 1, end.getDate(), 23, 59, 59);

    const prevTransactions = await this.adapter.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString());

    const prevSpent = (prevTransactions.data || [])
      .filter(tx => tx.tx_type === 'spend')
      .reduce((sum, tx) => sum + tx.credits, 0);

    const prevPurchased = (prevTransactions.data || [])
      .filter(tx => tx.tx_type === 'purchase')
      .reduce((sum, tx) => sum + tx.credits, 0);

    // Simple linear trend prediction
    const monthsDiff = prevSpent > 0 ? spent / prevSpent : 1;
    const nextMonthSpend = Math.round(spent * monthsDiff);
    const nextMonthRevenue = nextMonthSpend * 0.10;

    const report: UserBillingSummary = {
      period: { start, end },
      credits: {
        spent,
        purchased,
        refunded,
        earned,
        net_change: net_change,
        current_balance: currentBalance
      },
      operations: {
        top_operations: topOperations,
        total_operations: txData.filter(tx => tx.tx_type === 'spend').length
      },
      financial: {
        revenue,
        average_daily_spend: Math.round(averageDailySpend * 100) / 100
      },
      trends: {
        vs_previous_month: {
          spent_change: prevSpent > 0 ? ((spent - prevSpent) / prevSpent) * 100 : 0,
          purchased_change: prevPurchased > 0 ? ((purchased - prevPurchased) / prevPurchased) * 100 : 0
        },
        predictions: {
          next_month_spend: nextMonthSpend,
          next_month_revenue: Math.round(nextMonthRevenue * 100) / 100
        }
      }
    };

    // Save report to database
    await this.saveBillingReport(userId, 'user', start, end, report);

    return report;
  }

  // Generate monthly admin/platform report
  async generateAdminReport(periodStart?: Date, periodEnd?: Date): Promise<AdminBillingSummary> {
    // Default to previous month if no period specified
    const now = new Date();
    const start = periodStart || new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = periodEnd || new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get all transactions for the period
    const transactions = await this.adapter.supabase
      .from('credit_transactions')
      .select('*, users!inner(email)')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (transactions.error) {
      throw new Error(`Failed to fetch transactions: ${transactions.error.message}`);
    }

    const txData = transactions.data || [];

    // Aggregate platform data
    const totalPurchased = txData.filter(tx => tx.tx_type === 'purchase').reduce((sum, tx) => sum + tx.credits, 0);
    const totalSpent = txData.filter(tx => tx.tx_type === 'spend').reduce((sum, tx) => sum + tx.credits, 0);
    const totalRefunded = txData.filter(tx => tx.tx_type === 'refund').reduce((sum, tx) => sum + tx.credits, 0);
    const totalEarned = txData.filter(tx => tx.tx_type === 'earn').reduce((sum, tx) => sum + tx.credits, 0);

    // Get user statistics
    const uniqueUsers = new Set(txData.map(tx => tx.user_id));
    const activeUsers = new Set(txData.filter(tx => tx.tx_type === 'spend').map(tx => tx.user_id));
    const totalUsers = await this.adapter.supabase.from('users').select('id', { count: 'exact' });

    // Calculate new users (users who made first transaction in this period)
    const userFirstTx = new Map<string, Date>();
    txData.forEach(tx => {
      const existing = userFirstTx.get(tx.user_id);
      if (!existing || new Date(tx.created_at) < existing) {
        userFirstTx.set(tx.user_id, new Date(tx.created_at));
      }
    });

    const newUsers = Array.from(userFirstTx.entries()).filter(([, firstTx]) =>
      firstTx >= start && firstTx <= end
    ).length;

    // Top spending users
    const userStats = new Map<string, { email: string; spent: number; operations: number }>();
    txData.forEach(tx => {
      if (tx.tx_type === 'spend') {
        const existing = userStats.get(tx.user_id) || { email: (tx.users as any).email, spent: 0, operations: 0 };
        userStats.set(tx.user_id, {
          email: existing.email,
          spent: existing.spent + tx.credits,
          operations: existing.operations + 1
        });
      }
    });

    const topUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({ user_id: userId, ...stats }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);

    // Financial calculations
    const totalRevenue = totalPurchased * 0.10; // $0.10 per credit
    const averageRevenuePerUser = totalRevenue / Math.max(uniqueUsers.size, 1);
    const refundRate = totalPurchased > 0 ? (totalRefunded / totalPurchased) * 100 : 0;
    const averagePerUser = totalSpent / Math.max(activeUsers.size, 1);

    // Previous month comparison
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const prevEnd = new Date(start.getFullYear(), start.getMonth() - 1, end.getDate(), 23, 59, 59);

    const prevTransactions = await this.adapter.supabase
      .from('credit_transactions')
      .select('*')
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString());

    const prevRevenue = ((prevTransactions.data || [])
      .filter(tx => tx.tx_type === 'purchase')
      .reduce((sum, tx) => sum + tx.credits, 0)) * 0.10;

    const prevUsers = new Set((prevTransactions.data || []).map(tx => tx.user_id));

    // Simple predictions
    const revenueGrowth = prevRevenue > 0 ? (totalRevenue - prevRevenue) / prevRevenue : 0;
    const nextMonthRevenue = totalRevenue * (1 + revenueGrowth);
    const projectedUsers = uniqueUsers.size * 1.1; // 10% growth assumption

    const report: AdminBillingSummary = {
      period: { start, end },
      platform: {
        total_users: totalUsers.count || 0,
        active_users: activeUsers.size,
        new_users: newUsers
      },
      credits: {
        total_purchased: totalPurchased,
        total_spent: totalSpent,
        total_refunded: totalRefunded,
        total_earned: totalEarned,
        net_circulation_change: totalEarned + totalRefunded - totalSpent,
        average_per_user: Math.round(averagePerUser * 100) / 100
      },
      financial: {
        total_revenue: Math.round(totalRevenue * 100) / 100,
        average_revenue_per_user: Math.round(averageRevenuePerUser * 100) / 100,
        refund_rate: Math.round(refundRate * 100) / 100
      },
      top_users: topUsers,
      trends: {
        vs_previous_month: {
          revenue_change: Math.round(revenueGrowth * 10000) / 100, // percentage
          user_growth: prevUsers.size > 0 ? ((uniqueUsers.size - prevUsers.size) / prevUsers.size) * 100 : 0,
          engagement_change: prevUsers.size > 0 ? ((activeUsers.size - prevUsers.size) / prevUsers.size) * 100 : 0
        },
        predictions: {
          next_month_revenue: Math.round(nextMonthRevenue * 100) / 100,
          projected_users: Math.round(projectedUsers)
        }
      }
    };

    // Save admin report to database
    await this.saveBillingReport(null, 'admin', start, end, report);

    return report;
  }

  // Save billing report to database
  private async saveBillingReport(
    userId: string | null,
    reportType: 'user' | 'admin',
    periodStart: Date,
    periodEnd: Date,
    reportData: any
  ): Promise<void> {
    const { error } = await this.adapter.supabase
      .from('billing_reports')
      .upsert({
        user_id: userId,
        report_type: reportType,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        total_credits_spent: reportData.credits?.spent || reportData.credits?.total_spent || 0,
        total_credits_purchased: reportData.credits?.purchased || reportData.credits?.total_purchased || 0,
        total_credits_refunded: reportData.credits?.refunded || reportData.credits?.total_refunded || 0,
        total_credits_earned: reportData.credits?.earned || reportData.credits?.total_earned || 0,
        net_balance_change: reportData.credits?.net_change || reportData.credits?.net_circulation_change || 0,
        report_json: reportData
      });

    if (error) {
      console.error('Error saving billing report:', error);
      // Don't throw - report generation should succeed even if saving fails
    }
  }

  // Get user's latest billing report
  async getUserLatestReport(userId: string): Promise<BillingReport | null> {
    const { data, error } = await this.adapter.supabase
      .from('billing_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('report_type', 'user')
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  // Get admin's latest platform report
  async getAdminLatestReport(): Promise<BillingReport | null> {
    const { data, error } = await this.adapter.supabase
      .from('billing_reports')
      .select('*')
      .is('user_id', null)
      .eq('report_type', 'admin')
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  // Generate monthly reports for all users (cron job)
  async generateMonthlyReports(): Promise<{
    usersProcessed: number;
    adminReportGenerated: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let usersProcessed = 0;

    try {
      // Generate admin report first
      await this.generateAdminReport();

      // Get all users
      const { data: users, error: usersError } = await this.adapter.supabase
        .from('users')
        .select('id');

      if (usersError) {
        errors.push(`Failed to fetch users: ${usersError.message}`);
        return { usersProcessed: 0, adminReportGenerated: true, errors };
      }

      // Generate report for each user
      for (const user of users || []) {
        try {
          await this.generateUserReport(user.id);
          usersProcessed++;
        } catch (error: any) {
          errors.push(`Failed to generate report for user ${user.id}: ${error.message}`);
        }
      }

      return {
        usersProcessed,
        adminReportGenerated: true,
        errors
      };
    } catch (error: any) {
      errors.push(`Critical error in monthly report generation: ${error.message}`);
      return {
        usersProcessed,
        adminReportGenerated: false,
        errors
      };
    }
  }

  // Send email notifications (placeholder - integrate with email service)
  async sendMonthlyEmailNotifications(): Promise<{
    userEmailsSent: number;
    adminEmailsSent: number;
    errors: string[];
  }> {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    // For now, just mark reports as emailed
    const errors: string[] = [];
    let userEmailsSent = 0;
    let adminEmailsSent = 0;

    try {
      // Mark admin reports as emailed
      const { error: adminError } = await this.adapter.supabase
        .from('billing_reports')
        .update({ email_sent: true })
        .is('user_id', null)
        .eq('report_type', 'admin')
        .eq('email_sent', false);

      if (adminError) {
        errors.push(`Failed to mark admin reports as emailed: ${adminError.message}`);
      } else {
        adminEmailsSent = 1; // Assuming one admin report per month
      }

      // Mark user reports as emailed
      const { data: userReports, error: userError } = await this.adapter.supabase
        .from('billing_reports')
        .update({ email_sent: true })
        .eq('report_type', 'user')
        .eq('email_sent', false)
        .select('id');

      if (userError) {
        errors.push(`Failed to mark user reports as emailed: ${userError.message}`);
      } else {
        userEmailsSent = userReports?.length || 0;
      }

      return {
        userEmailsSent,
        adminEmailsSent,
        errors
      };
    } catch (error: any) {
      errors.push(`Error in email notification process: ${error.message}`);
      return {
        userEmailsSent: 0,
        adminEmailsSent: 0,
        errors
      };
    }
  }
}

export const billingService = new BillingService();
export { BillingService };
