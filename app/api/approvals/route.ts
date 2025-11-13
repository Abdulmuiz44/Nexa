import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApprovalWorkflowService } from '@/src/lib/services/approvalWorkflowService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'pending') {
      const pending = await ApprovalWorkflowService.getPendingApprovals(session.user.id);
      return NextResponse.json({ pending, total: pending.length });
    }

    if (action === 'stats') {
      const stats = await ApprovalWorkflowService.getApprovalStats(session.user.id);
      return NextResponse.json({ stats });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Approvals GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, draftId, rejectionReason } = await request.json();

    if (!action || !draftId) {
      return NextResponse.json({ error: 'action and draftId are required' }, { status: 400 });
    }

    if (!['approve', 'reject', 'publish'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approve, reject, or publish' }, { status: 400 });
    }

    let result;
    if (action === 'approve') {
      result = await ApprovalWorkflowService.approveDraft(draftId, session.user.id);
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'rejectionReason is required for reject action' }, { status: 400 });
      }
      result = await ApprovalWorkflowService.rejectDraft(draftId, session.user.id, rejectionReason);
    } else if (action === 'publish') {
      result = await ApprovalWorkflowService.publishApprovedContent(draftId, session.user.id);
    }

    return NextResponse.json({ success: true, draft: result });
  } catch (error) {
    console.error('Approvals POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
