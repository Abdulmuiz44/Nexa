import { NextRequest, NextResponse } from 'next/server';
import { ContentRepurposingService } from '@/lib/services/contentRepurposingService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
} else {
  console.warn('Supabase environment variables not set - repurpose API will not function');
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sources = await ContentRepurposingService.getContentSources(user.id);
    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Repurpose GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

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
    const { action, source_type, title, content, source_url, source_id, num_posts = 10 } = body;

    if (action === 'import') {
      const source = await ContentRepurposingService.importContent(
        user.id,
        source_type,
        title,
        content,
        source_url
      );
      return NextResponse.json({ success: true, source });
    }

    if (action === 'generate') {
      const posts = await ContentRepurposingService.repurposeContent(source_id, user.id, num_posts);
      return NextResponse.json({ success: true, posts, count: posts.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Repurpose POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
