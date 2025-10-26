import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabaseServer';

export type Platform = 'twitter' | 'reddit';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CreditTxType = 'earn' | 'spend' | 'purchase' | 'refund' | 'adjust';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  phone?: string;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  platform_user_id: string;
  username: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  scopes: string[];
}

export interface Conversation {
  id: string;
  user_id: string;
  source: 'web' | 'whatsapp';
  session_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface Post {
  id: string;
  user_id: string;
  campaign_id?: string;
  platform: Platform;
  content: string;
  status: PostStatus;
  scheduled_at?: Date;
  published_at?: Date;
  platform_post_id?: string;
  platform_post_url?: string;
  metadata?: Record<string, any>;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  platforms: Platform[];
  duration_days: number;
  posts_per_day: number;
  topic?: string;
  status: CampaignStatus;
  start_date?: Date;
  end_date?: Date;
  metadata?: Record<string, any>;
}

export interface Analytics {
  id: string;
  post_id: string;
  platform: Platform;
  impressions: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement_rate: number;
  fetched_at: Date;
}

export interface CreditsWallet {
  id: string;
  user_id: string;
  balance: number;
  total_purchased: number;
  total_spent: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  tx_type: CreditTxType;
  credits: number;
  description?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  amount_usd: number;
  credits_issued: number;
  payment_provider: string;
  provider_ref?: string;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class SupabaseAdapter {
  private supabase: SupabaseClient;

  constructor() {
    // Use server-side client for database operations
    this.supabase = createServerClient();
  }

  // User operations
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  }

  async createUser(userData: Partial<User>): Promise<string> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data.id;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Connected accounts operations
  async getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
    const { data, error } = await this.supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching connected accounts:', error);
      return [];
    }

    return data || [];
  }

  async getConnectedAccount(userId: string, platform: Platform): Promise<ConnectedAccount | null> {
    const { data, error } = await this.supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async createConnectedAccount(accountData: Omit<ConnectedAccount, 'id'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('connected_accounts')
      .insert(accountData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create connected account: ${error.message}`);
    }

    return data.id;
  }

  async updateConnectedAccount(accountId: string, updates: Partial<ConnectedAccount>): Promise<void> {
    const { error } = await this.supabase
      .from('connected_accounts')
      .update(updates)
      .eq('id', accountId);

    if (error) {
      throw new Error(`Failed to update connected account: ${error.message}`);
    }
  }

  async checkPlatformConnection(userId: string, platform: Platform): Promise<boolean> {
    const account = await this.getConnectedAccount(userId, platform);
    return !!account;
  }

  // Conversation operations
  async getOrCreateConversation(userId: string, source: 'web' | 'whatsapp', sessionId?: string): Promise<string> {
    // Try to find existing conversation
    const { data: existing } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('source', source)
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        user_id: userId,
        source,
        session_id: sessionId
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data.id;
  }

  async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): Promise<string> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return data.id;
  }

  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data?.reverse() || [];
  }

  // Post operations
  async createPost(postData: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('posts')
      .insert(postData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return data.id;
  }

  async updatePostStatus(postId: string, status: PostStatus): Promise<void> {
    const updates: Partial<Post> = { status };

    if (status === 'published') {
      updates.published_at = new Date();
    }

    const { error } = await this.supabase
      .from('posts')
      .update(updates)
      .eq('id', postId);

    if (error) {
      throw new Error(`Failed to update post status: ${error.message}`);
    }
  }

  async updatePostPlatformInfo(postId: string, platformPostId: string, platformPostUrl: string): Promise<void> {
    const { error } = await this.supabase
      .from('posts')
      .update({
        platform_post_id: platformPostId,
        platform_post_url: platformPostUrl
      })
      .eq('id', postId);

    if (error) {
      throw new Error(`Failed to update post platform info: ${error.message}`);
    }
  }

  async getUserPosts(userId: string, limit = 50): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    return data || [];
  }

  async getScheduledPosts(): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return [];
    }

    return data || [];
  }

  // Campaign operations
  async createCampaign(campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .insert(campaignData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return data.id;
  }

  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }

    return data || [];
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    const { error } = await this.supabase
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId);

    if (error) {
      throw new Error(`Failed to update campaign status: ${error.message}`);
    }
  }

  // Analytics operations
  async createAnalytics(analyticsData: Omit<Analytics, 'id' | 'created_at'>): Promise<string> {
    const { data, error } = await this.supabase
      .from('analytics')
      .insert(analyticsData)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create analytics: ${error.message}`);
    }

    return data.id;
  }

  async getUserAnalytics(userId: string, days = 7, platform?: Platform): Promise<Analytics[]> {
    let query = this.supabase
      .from('analytics')
      .select('*, posts!inner(user_id)')
      .eq('posts.user_id', userId)
      .gte('fetched_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('fetched_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }

    return data || [];
  }

  async getPostAnalytics(postId: string): Promise<Analytics[]> {
    const { data, error } = await this.supabase
      .from('analytics')
      .select('*')
      .eq('post_id', postId)
      .order('fetched_at', { ascending: false });

    if (error) {
      console.error('Error fetching post analytics:', error);
      return [];
    }

    return data || [];
  }

  // Activity log operations
  async logActivity(userId: string, action: string, description?: string, metadata?: Record<string, any>): Promise<string> {
    const { data, error } = await this.supabase
      .from('activity_log')
      .insert({
        user_id: userId,
        action,
        description,
        metadata
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      throw new Error(`Failed to log activity: ${error.message}`);
    }

    return data.id;
  }

  async getUserActivity(userId: string, limit = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity:', error);
      return [];
    }

    return data || [];
  }

  // OAuth state operations
  async createOAuthState(stateData: { state: string; user_id?: string; platform: Platform; redirect_uri?: string }): Promise<void> {
    const { error } = await this.supabase
      .from('oauth_states')
      .insert(stateData);

    if (error) {
      throw new Error(`Failed to create OAuth state: ${error.message}`);
    }
  }

  async getOAuthState(state: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async deleteOAuthState(state: string): Promise<void> {
    const { error } = await this.supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    if (error) {
      console.error('Error deleting OAuth state:', error);
    }
  }

  // Cleanup expired OAuth states
  async cleanupExpiredOAuthStates(): Promise<void> {
    const { error } = await this.supabase
      .from('oauth_states')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired OAuth states:', error);
    }
  }

  // Utility methods
  async getUserProfile(userId: string): Promise<{
    connectedPlatforms: Platform[];
    plan: 'free' | 'pro' | 'enterprise';
    totalPosts: number;
  } | null> {
    const [accounts, posts] = await Promise.all([
      this.getConnectedAccounts(userId),
      this.getUserPosts(userId, 1000)
    ]);

    const user = await this.getUser(userId);
    if (!user) return null;

    return {
      connectedPlatforms: accounts.map(a => a.platform),
      plan: user.plan,
      totalPosts: posts.length
    };
  }

  // Credit system methods
  async getCreditsWallet(userId: string): Promise<CreditsWallet | null> {
    const { data, error } = await this.supabase
      .from('credits_wallet')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching credits wallet:', error);
      return null;
    }

    return data;
  }

  async createCreditsWallet(userId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('credits_wallet')
      .insert({
        user_id: userId,
        balance: 100, // Welcome credits
        total_purchased: 0,
        total_spent: 0
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create credits wallet: ${error.message}`);
    }

    return data.id;
  }

  async updateCreditsBalance(userId: string, credits: number, operation: 'add' | 'subtract'): Promise<void> {
    const wallet = await this.getCreditsWallet(userId);
    if (!wallet) {
      throw new Error('Credits wallet not found');
    }

    const newBalance = operation === 'add' ? wallet.balance + credits : wallet.balance - credits;
    if (newBalance < 0) {
      throw new Error('Insufficient credits');
    }

    const updates: Partial<CreditsWallet> = {
      balance: newBalance
    };

    if (operation === 'add') {
      updates.total_purchased = wallet.total_purchased + credits;
    } else {
      updates.total_spent = wallet.total_spent + credits;
    }

    const { error } = await this.supabase
      .from('credits_wallet')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update credits balance: ${error.message}`);
    }
  }

  async addCreditTransaction(
    userId: string,
    txType: CreditTxType,
    credits: number,
    description?: string,
    referenceId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        tx_type: txType,
        credits,
        description,
        reference_id: referenceId,
        metadata
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to add credit transaction: ${error.message}`);
    }

    return data.id;
  }

  async getCreditTransactions(userId: string, limit = 50): Promise<CreditTransaction[]> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching credit transactions:', error);
      return [];
    }

    return data || [];
  }

  async recordPayment(
    userId: string,
    amountUsd: number,
    creditsIssued: number,
    paymentProvider: string,
    providerRef?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        amount_usd: amountUsd,
        credits_issued: creditsIssued,
        payment_provider: paymentProvider,
        provider_ref: providerRef,
        status: 'pending',
        metadata
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to record payment: ${error.message}`);
    }

    return data.id;
  }

  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    const { error } = await this.supabase
      .from('payment_history')
      .update({ status })
      .eq('id', paymentId);

    if (error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  async getPaymentHistory(userId: string, limit = 20): Promise<PaymentHistory[]> {
    const { data, error } = await this.supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  }

  async spendCredits(userId: string, credits: number, description: string, referenceId?: string): Promise<void> {
    // Update balance
    await this.updateCreditsBalance(userId, credits, 'subtract');

    // Record transaction
    await this.addCreditTransaction(userId, 'spend', credits, description, referenceId);
  }

  async earnCredits(userId: string, credits: number, description: string, referenceId?: string): Promise<void> {
    // Update balance
    await this.updateCreditsBalance(userId, credits, 'add');

    // Record transaction
    await this.addCreditTransaction(userId, 'earn', credits, description, referenceId);
  }

  async processCreditTopUp(
    userId: string,
    amountUsd: number,
    creditsIssued: number,
    paymentProvider: string,
    providerRef?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Record the payment
    const paymentId = await this.recordPayment(userId, amountUsd, creditsIssued, paymentProvider, providerRef, metadata);

    // Update payment status to completed
    await this.updatePaymentStatus(paymentId, 'completed');

    // Add credits to wallet
    await this.updateCreditsBalance(userId, creditsIssued, 'add');

    // Record the credit transaction
    await this.addCreditTransaction(
      userId,
      'purchase',
      creditsIssued,
      `Credit top-up: $${amountUsd}`,
      paymentId,
      { payment_provider: paymentProvider, provider_ref: providerRef }
    );
  }
}
