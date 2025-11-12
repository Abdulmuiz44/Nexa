import { supabaseServer } from '@/src/lib/supabaseServer';

export interface ContentDraft {
  id?: string;
  user_id: string;
  platform: 'twitter' | 'reddit';
  content: string;
  topic?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
  created_at?: string;
  updated_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  metadata?: Record<string, any>;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export class ApprovalWorkflowService {
  static async createDraft(draft: Omit<ContentDraft, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<ContentDraft> {
    const { data, error } = await supabaseServer
      .from('content_drafts')
      .insert({
        ...draft,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async submitForApproval(draftId: string, userId: string): Promise<ContentDraft> {
    const { data, error } = await supabaseServer
      .from('content_drafts')
      .update({
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async approveDraft(draftId: string, approverId: string): Promise<ContentDraft> {
    const { data, error } = await supabaseServer
      .from('content_drafts')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async rejectDraft(draftId: string, approverId: string, reason: string): Promise<ContentDraft> {
    const { data, error } = await supabaseServer
      .from('content_drafts')
      .update({
        status: 'rejected',
        approved_by: approverId,
        rejection_reason: reason,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPendingApprovals(userId: string): Promise<ContentDraft[]> {
    const { data, error } = await supabaseServer
      .from('content_drafts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserDrafts(userId: string, status?: ContentDraft['status']): Promise<ContentDraft[]> {
    let query = supabaseServer
      .from('content_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getApprovalStats(userId: string): Promise<ApprovalStats> {
    const { data, error } = await supabaseServer
      .from('content_drafts')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: data?.length || 0,
    };

    data?.forEach(draft => {
      switch (draft.status) {
        case 'pending_approval':
          stats.pending++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
      }
    });

    return stats;
  }

  static async publishApprovedContent(draftId: string, userId: string): Promise<{ success: boolean; postId?: string }> {
    // Get the approved draft
    const { data: draft, error: draftError } = await supabaseServer
      .from('content_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .single();

    if (draftError || !draft) {
      throw new Error('Approved draft not found');
    }

    // Create the post
    const { data: post, error: postError } = await supabaseServer
      .from('posts')
      .insert({
        user_id: userId,
        platform: draft.platform,
        content: draft.content,
        status: 'published',
        published_at: new Date().toISOString(),
        metadata: {
          ...draft.metadata,
          draft_id: draftId,
          approved_by: draft.approved_by,
        },
      })
      .select('id')
      .single();

    if (postError) throw postError;

    // Update draft status
    await supabaseServer
      .from('content_drafts')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId);

    return { success: true, postId: post.id };
  }
}
