import { SupabaseAdapter, CreditsWallet, CreditTransaction, PaymentHistory, CreditTxType } from '@/src/lib/db/supabase-adapter';

export interface CreditFailure {
  id: string;
  user_id: string;
  operation_type: string;
  credits_required: number;
  credits_available: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CreditUsageAnalytics {
  id: string;
  user_id: string;
  date: Date;
  total_credits_spent: number;
  credits_purchased: number;
  credits_remaining: number;
  operation_breakdown: Record<string, number>;
  created_at: Date;
  updated_at: Date;
}

class CreditService {
  private adapter: SupabaseAdapter;

  constructor() {
    this.adapter = new SupabaseAdapter();
  }

  // Get user's credit balance
  async getCreditBalance(userId: string): Promise<number> {
    const wallet = await this.adapter.getCreditsWallet(userId);
    return wallet?.balance || 0;
  }

  // Get user's credit wallet details
  async getCreditsWallet(userId: string): Promise<CreditsWallet | null> {
    return await this.adapter.getCreditsWallet(userId);
  }

  // Create wallet for new user (with welcome credits)
  async createCreditsWallet(userId: string): Promise<string> {
    return await this.adapter.createCreditsWallet(userId);
  }

  // Get credit transaction history
  async getCreditTransactions(userId: string, limit = 50): Promise<CreditTransaction[]> {
    return await this.adapter.getCreditTransactions(userId, limit);
  }

  // Get payment history
  async getPaymentHistory(userId: string, limit = 20): Promise<PaymentHistory[]> {
    return await this.adapter.getPaymentHistory(userId, limit);
  }

  // Spend credits (for AI generations, campaigns, etc.)
  async spendCredits(
    userId: string,
    credits: number,
    description: string,
    referenceId?: string
  ): Promise<void> {
    return await this.adapter.spendCredits(userId, credits, description, referenceId);
  }

  // Enhanced spending with operation tracking
  async spendCreditsWithTracking(
    userId: string,
    credits: number,
    description: string,
    operationType: string,
    operationId?: string,
    referenceId?: string
  ): Promise<void> {
    return await this.adapter.spendCreditsWithTracking(
      userId,
      credits,
      description,
      operationType,
      operationId,
      referenceId
    );
  }

  // Earn credits (referrals, bonuses, etc.)
  async earnCredits(
    userId: string,
    credits: number,
    description: string,
    referenceId?: string
  ): Promise<void> {
    return await this.adapter.earnCredits(userId, credits, description, referenceId);
  }

  // Process credit top-up after successful payment
  async processCreditTopUp(
    userId: string,
    amountUsd: number,
    creditsIssued: number,
    paymentProvider: string,
    providerRef?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return await this.adapter.processCreditTopUp(
      userId,
      amountUsd,
      creditsIssued,
      paymentProvider,
      providerRef,
      metadata
    );
  }

  // Check if user has sufficient credits
  async hasSufficientCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.getCreditBalance(userId);
    return balance >= requiredCredits;
  }

  // Get credit usage statistics
  async getCreditStats(userId: string): Promise<{
    balance: number;
    totalPurchased: number;
    totalSpent: number;
    recentTransactions: CreditTransaction[];
  }> {
    const wallet = await this.adapter.getCreditsWallet(userId);
    const transactions = await this.adapter.getCreditTransactions(userId, 10);

    return {
      balance: wallet?.balance || 0,
      totalPurchased: wallet?.total_purchased || 0,
      totalSpent: wallet?.total_spent || 0,
      recentTransactions: transactions
    };
  }

  // Get credit usage analytics
  async getCreditUsageAnalytics(userId: string, days = 30): Promise<CreditUsageAnalytics[]> {
    return await this.adapter.getCreditUsageAnalytics(userId, days);
  }

  // Log credit failure
  async logCreditFailure(
    userId: string,
    operationType: string,
    creditsRequired: number,
    creditsAvailable: number,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.adapter.logCreditFailure(userId, operationType, creditsRequired, creditsAvailable, metadata);
  }

  // Get credit failures
  async getCreditFailures(userId: string, limit = 20): Promise<CreditFailure[]> {
    return await this.adapter.getCreditFailures(userId, limit);
  }

  // Get comprehensive credit analytics
  async getCreditAnalytics(userId: string, days = 30): Promise<{
    balance: number;
    totalPurchased: number;
    totalSpent: number;
    recentTransactions: CreditTransaction[];
    usageAnalytics: CreditUsageAnalytics[];
    recentFailures: CreditFailure[];
    topOperations: Record<string, number>;
  }> {
    const [balance, transactions, analytics, failures, wallet] = await Promise.all([
      this.getCreditBalance(userId),
      this.getCreditTransactions(userId, 20),
      this.getCreditUsageAnalytics(userId, days),
      this.getCreditFailures(userId, 10),
      this.getCreditsWallet(userId)
    ]);

    // Calculate top operations from analytics
    const topOperations: Record<string, number> = {};
    analytics.forEach(day => {
      Object.entries(day.operation_breakdown || {}).forEach(([op, count]) => {
        topOperations[op] = (topOperations[op] || 0) + (count as number);
      });
    });

    return {
      balance,
      totalPurchased: wallet?.total_purchased || 0,
      totalSpent: wallet?.total_spent || 0,
      recentTransactions: transactions,
      usageAnalytics: analytics,
      recentFailures: failures,
      topOperations
    };
  }

  // Admin Functions
  async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.adapter.getUser(userId);
    return user?.is_admin || false;
  }

  async setUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
    await this.adapter.updateUser(userId, { is_admin: isAdmin });
  }

  async getAllUsersWithCredits(limit = 100, offset = 0): Promise<{
    users: Array<{
      id: string;
      email: string;
      name?: string;
      balance: number;
      total_purchased: number;
      total_spent: number;
      is_admin: boolean;
      created_at: Date;
    }>;
    total: number;
  }> {
    const { data: users, error, count } = await this.supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        is_admin,
        created_at,
        credits_wallet (
          balance,
          total_purchased,
          total_spent
        )
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users with credits:', error);
      return { users: [], total: 0 };
    }

    const formattedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      balance: user.credits_wallet?.[0]?.balance || 0,
      total_purchased: user.credits_wallet?.[0]?.total_purchased || 0,
      total_spent: user.credits_wallet?.[0]?.total_spent || 0,
      is_admin: user.is_admin || false,
      created_at: user.created_at
    })) || [];

    return { users: formattedUsers, total: count || 0 };
  }

  async getAdminCreditOverview(): Promise<{
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
    recentTransactions: CreditTransaction[];
    dailyUsage: Array<{
      date: string;
      total_spent: number;
      total_purchased: number;
    }>;
  }> {
    // Get all wallets
    const { data: wallets } = await this.supabase
      .from('credits_wallet')
      .select('balance, total_purchased, total_spent');

    // Get recent transactions
    const { data: transactions } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get daily usage
    const { data: dailyUsage } = await this.supabase
      .from('credit_usage_analytics')
      .select('date, total_credits_spent, credits_purchased')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Get top spending users
    const { data: topUsers } = await this.supabase
      .from('credits_wallet')
      .select(`
        user_id,
        total_spent,
        users!inner(email)
      `)
      .order('total_spent', { ascending: false })
      .limit(10);

    const totalCreditsInCirculation = wallets?.reduce((sum, w) => sum + w.balance, 0) || 0;
    const totalCreditsPurchased = wallets?.reduce((sum, w) => sum + w.total_purchased, 0) || 0;
    const totalCreditsSpent = wallets?.reduce((sum, w) => sum + w.total_spent, 0) || 0;
    const averageUserBalance = wallets && wallets.length > 0 ? totalCreditsInCirculation / wallets.length : 0;

    return {
      totalUsers: wallets?.length || 0,
      totalCreditsInCirculation,
      totalCreditsPurchased,
      totalCreditsSpent,
      averageUserBalance,
      topSpendingUsers: topUsers?.map(u => ({
        user_id: u.user_id,
        email: (u.users as any).email,
        total_spent: u.total_spent
      })) || [],
      recentTransactions: transactions || [],
      dailyUsage: dailyUsage?.map(d => ({
        date: d.date,
        total_spent: d.total_credits_spent,
        total_purchased: d.credits_purchased
      })) || []
    };
  }

  async adjustUserCredits(
    adminUserId: string,
    targetUserId: string,
    credits: number,
    reason: string,
    adjustmentType: 'adjust' | 'refund' = 'adjust'
  ): Promise<void> {
    // Verify admin status
    const isAdmin = await this.isUserAdmin(adminUserId);
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Create wallet if it doesn't exist
    let wallet = await this.getCreditsWallet(targetUserId);
    if (!wallet) {
      await this.createCreditsWallet(targetUserId);
      wallet = await this.getCreditsWallet(targetUserId);
    }

    if (!wallet) {
      throw new Error('Failed to create or find user wallet');
    }

    // For adjustments, credits can be positive (add) or negative (subtract)
    // For refunds, credits should be positive (add back)
    const actualCredits = adjustmentType === 'refund' ? Math.abs(credits) : credits;

    if (actualCredits < 0 && wallet.balance < Math.abs(actualCredits)) {
      throw new Error('Cannot subtract more credits than user has');
    }

    // Update balance
    await this.updateCreditsBalance(targetUserId, actualCredits, actualCredits >= 0 ? 'add' : 'subtract');

    // Record transaction
    await this.addCreditTransaction(
      targetUserId,
      adjustmentType,
      actualCredits,
      `${adjustmentType === 'refund' ? 'Refund' : 'Admin adjustment'}: ${reason}`,
      `admin_${adminUserId}_${Date.now()}`,
      {
        admin_id: adminUserId,
        adjustment_reason: reason,
        previous_balance: wallet.balance
      }
    );
  }

  // Credit costs for different operations
  static CREDIT_COSTS = {
    CONTENT_GENERATION: 5,     // 5 credits per content generation
    CAMPAIGN_CREATION: 10,     // 10 credits per campaign
    POST_SCHEDULING: 2,        // 2 credits per post scheduling
    ANALYTICS_FETCH: 1,        // 1 credit per analytics fetch
    AI_CHAT_MESSAGE: 1,        // 1 credit per AI chat message
  } as const;

  // Get cost for a specific operation
  getCostForOperation(operation: keyof typeof CreditService.CREDIT_COSTS): number {
    return CreditService.CREDIT_COSTS[operation];
  }

  // Credit packages for purchase
  static CREDIT_PACKAGES = [
    { credits: 100, usd: 10, popular: false },
    { credits: 250, usd: 25, popular: false },
    { credits: 500, usd: 45, popular: true },
    { credits: 1000, usd: 80, popular: false },
    { credits: 2500, usd: 180, popular: false },
  ] as const;
}

export const creditService = new CreditService();
export { CreditService };
