import { createClient } from '@supabase/supabase-js';
import { ApprovalQueueItem, PostApproval, LearningFeedback } from '@/types/features';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class ApprovalWorkflowService {
  /**
   * Get pending approvals for a user
   */
  static async getPendingApprovals(userId: string): Promise<ApprovalQueueItem[]> {
    const { data: approvals, error } = await supabase
      .from('post_approvals')
      .select(`
        *,
        post:posts (
          platform,
          scheduled_at,
          campaign_id
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch approvals: ${error.message}`);
    return approvals as ApprovalQueueItem[];
  }

  /**
   * Create approval request for a post
   */
  static async createApprovalRequest(
    userId: string,
    postId: string,
    content: string
  ): Promise<PostApproval> {
    const { data, error } = await supabase
      .from('post_approvals')
      .insert({
        user_id: userId,
        post_id: postId,
        original_content: content,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create approval request: ${error.message}`);
    return data as PostApproval;
  }

  /**
   * Approve a post
   */
  static async approvePost(
    approvalId: string,
    editedContent?: string,
    feedback?: string
  ): Promise<PostApproval> {
    const updateData: any = {
      status: editedContent ? 'edited' : 'approved',
      approved_at: new Date().toISOString(),
    };

    if (editedContent) {
      updateData.edited_content = editedContent;
    }
    if (feedback) {
      updateData.feedback = feedback;
    }

    const { data, error } = await supabase
      .from('post_approvals')
      .update(updateData)
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw new Error(`Failed to approve post: ${error.message}`);

    // If edited, update the actual post content
    if (editedContent && data) {
      await supabase
        .from('posts')
        .update({ content: editedContent })
        .eq('id', data.post_id);
    }

    // Track learning feedback if edited
    if (editedContent && data) {
      await this.trackLearningFeedback(
        data.user_id,
        data.post_id,
        data.original_content,
        editedContent
      );
    }

    return data as PostApproval;
  }

  /**
   * Reject a post
   */
  static async rejectPost(
    approvalId: string,
    feedback?: string
  ): Promise<PostApproval> {
    const { data, error } = await supabase
      .from('post_approvals')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        feedback: feedback
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw new Error(`Failed to reject post: ${error.message}`);

    // Update post status to failed
    if (data) {
      await supabase
        .from('posts')
        .update({ status: 'failed' })
        .eq('id', data.post_id);
    }

    return data as PostApproval;
  }

  /**
   * Track learning feedback to improve AI
   */
  static async trackLearningFeedback(
    userId: string,
    postId: string,
    originalContent: string,
    editedContent: string
  ): Promise<void> {
    // Determine edit type based on differences
    const editType = this.detectEditType(originalContent, editedContent);

    await supabase.from('learning_feedback').insert({
      user_id: userId,
      post_id: postId,
      original_content: originalContent,
      edited_content: editedContent,
      edit_type: editType,
      metadata: {
        original_length: originalContent.length,
        edited_length: editedContent.length,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Detect the type of edit made
   */
  private static detectEditType(
    original: string,
    edited: string
  ): 'tone' | 'length' | 'format' | 'content' | 'other' {
    const lengthDiff = Math.abs(original.length - edited.length);
    const lengthChangePercent = (lengthDiff / original.length) * 100;

    // Check if it's mainly a length change
    if (lengthChangePercent > 30) {
      return 'length';
    }

    // Check for emoji or formatting changes
    const originalEmojis = (original.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    const editedEmojis = (edited.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    if (Math.abs(originalEmojis - editedEmojis) > 2) {
      return 'format';
    }

    // Check for tone words (simple heuristic)
    const toneWords = ['please', 'thanks', 'great', 'awesome', 'amazing', 'check out'];
    const originalTone = toneWords.filter(word => 
      original.toLowerCase().includes(word)
    ).length;
    const editedTone = toneWords.filter(word => 
      edited.toLowerCase().includes(word)
    ).length;
    if (Math.abs(originalTone - editedTone) > 0) {
      return 'tone';
    }

    // Check for significant content changes
    const similarityThreshold = 0.5;
    const similarity = this.calculateSimilarity(original, edited);
    if (similarity < similarityThreshold) {
      return 'content';
    }

    return 'other';
  }

  /**
   * Calculate text similarity (simple word-based)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get learning feedback history
   */
  static async getLearningHistory(userId: string): Promise<LearningFeedback[]> {
    const { data, error } = await supabase
      .from('learning_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(`Failed to fetch learning history: ${error.message}`);
    return data as LearningFeedback[];
  }

  /**
   * Get approval statistics
   */
  static async getApprovalStats(userId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    edited: number;
  }> {
    const { data, error } = await supabase
      .from('post_approvals')
      .select('status')
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to fetch stats: ${error.message}`);

    const stats = {
      total: data.length,
      pending: data.filter(a => a.status === 'pending').length,
      approved: data.filter(a => a.status === 'approved').length,
      rejected: data.filter(a => a.status === 'rejected').length,
      edited: data.filter(a => a.status === 'edited').length,
    };

    return stats;
  }

  /**
   * Enable auto-approval mode
   */
  static async toggleAutoApproval(userId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        onboarding_data: supabase.raw(`
          jsonb_set(
            COALESCE(onboarding_data, '{}'),
            '{auto_approval_enabled}',
            '${enabled}'
          )
        `)
      })
      .eq('id', userId);

    if (error) throw new Error(`Failed to toggle auto-approval: ${error.message}`);
  }
}
