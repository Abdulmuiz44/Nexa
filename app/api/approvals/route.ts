import { NextRequest, NextResponse } from 'next/server';
import { ApprovalWorkflowService } from '@/lib/services/approvalWorkflowService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'pending') {
      const pending = await ApprovalWorkflowService.getPendingApprovals(user.id);
      return NextResponse.json({ pending, total: pending.length });
    }

    if (action === 'stats') {
      const stats = await ApprovalWorkflowService.getApprovalStats(user.id);
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, approval_id, edited_content, feedback } = body;

    if (action === 'approve') {
      const result = await ApprovalWorkflowService.approvePost(approval_id, edited_content, feedback);
      return NextResponse.json({ success: true, approval: result });
    }

    if (action === 'reject') {
      const result = await ApprovalWorkflowService.rejectPost(approval_id, feedback);
      return NextResponse.json({ success: true, approval: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Approvals POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
