import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Fetch conversation with messages
    const { data: conversation, error } = await supabaseServer
      .from('conversations')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (
          id,
          role,
          content,
          created_at,
          metadata
        )
      `)
      .eq('id', conversationId)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Supabase error fetching conversation:', error);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        message_count: conversation.messages?.length || 0,
        messages: conversation.messages || [],
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch conversation:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const userId = session.user.id;

    // Verify conversation belongs to user
    const { data: conversation, error: fetchError } = await supabaseServer
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete all messages in the conversation first
    const { error: messagesError } = await supabaseServer
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to delete conversation messages' },
        { status: 500 }
      );
    }

    // Delete the conversation
    const { error: deleteError } = await supabaseServer
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
      deletedId: conversationId,
    });
  } catch (err: any) {
    console.error('Delete conversation error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const { title } = await req.json();

    // Verify conversation belongs to user
    const { data: conversation, error: fetchError } = await supabaseServer
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update conversation title
    const { error: updateError } = await supabaseServer
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully',
    });
  } catch (err: any) {
    console.error('Update conversation error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
