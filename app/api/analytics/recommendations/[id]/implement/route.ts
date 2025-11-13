import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const recommendationId = params.id;

    if (!recommendationId) {
      return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
    }

    // Mark recommendation as implemented
    const { error } = await supabaseClient
      .from('recommendations')
      .update({
        implemented: true,
        implemented_at: new Date().toISOString(),
      })
      .eq('id', recommendationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error implementing recommendation:', error);
      return NextResponse.json({ error: 'Failed to implement recommendation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error implementing recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
