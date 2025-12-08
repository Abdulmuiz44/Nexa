import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = getSupabaseClient();

    // Get user's repurposed content
    const { data: content, error } = await supabase
      .from('repurposed_content')
      .select(`
        *,
        social_posts:repurposed_social_posts(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching repurposed content:', error);
      return NextResponse.json({ content: [] });
    }

    // Transform data for frontend
    const transformedContent = (content || []).map(item => ({
      id: item.id,
      originalUrl: item.original_url,
      contentType: item.content_type,
      title: item.title,
      summary: item.summary,
      socialPosts: item.social_posts || [],
      createdAt: item.created_at,
      status: item.status,
    }));

    return NextResponse.json({ content: transformedContent });
  } catch (error) {
    console.error('Error in content repurposing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { url, contentType, userId: requestUserId } = await request.json();

    if (requestUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!url || !contentType) {
      return NextResponse.json({ error: 'URL and content type are required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Create repurposed content entry
    const { data: contentEntry, error: contentError } = await supabase
      .from('repurposed_content')
      .insert({
        user_id: userId,
        original_url: url,
        content_type: contentType,
        status: 'processing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (contentError) {
      console.error('Error creating content entry:', contentError);
      return NextResponse.json({ error: 'Failed to create content entry' }, { status: 500 });
    }

    // Mock content extraction and social post generation
    // In production, this would use web scraping and AI to extract content
    const mockTitle = `Content from ${url.split('/').pop() || 'Web Page'}`;
    const mockSummary = `This is a summary of the content extracted from ${url}. The AI would analyze the page content and generate key insights.`;

    // Generate mock social posts for different platforms
    const socialPosts = generateMockSocialPosts(mockTitle, mockSummary);

    // Update content entry with processed data
    const { error: updateError } = await supabase
      .from('repurposed_content')
      .update({
        title: mockTitle,
        summary: mockSummary,
        status: 'completed',
      })
      .eq('id', contentEntry.id);

    if (updateError) {
      console.error('Error updating content:', updateError);
    }

    // Save social posts
    if (socialPosts.length > 0) {
      const postsData = socialPosts.map(post => ({
        content_id: contentEntry.id,
        platform: post.platform,
        content: post.content,
        hashtags: post.hashtags,
        character_count: post.characterCount,
        tone: post.tone,
      }));

      const { error: postsError } = await supabase
        .from('repurposed_social_posts')
        .insert(postsData);

      if (postsError) {
        console.error('Error saving social posts:', postsError);
      }
    }

    return NextResponse.json({
      success: true,
      content: {
        ...contentEntry,
        title: mockTitle,
        summary: mockSummary,
        socialPosts,
        status: 'completed',
      }
    });
  } catch (error) {
    console.error('Error repurposing content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateMockSocialPosts(title: string, summary: string) {
  const platforms = ['twitter', 'reddit', 'linkedin'];
  const posts = [];

  for (const platform of platforms) {
    let content = '';
    let characterLimit = 280; // Twitter default
    let hashtags = ['AI', 'Tech', 'Growth'];

    switch (platform) {
      case 'twitter':
        content = `🚀 ${title}\n\n${summary.substring(0, 100)}...\n\n#AI #Tech #Growth`;
        hashtags = ['AI', 'Tech', 'Growth'];
        break;

      case 'reddit':
        content = `${title}\n\n${summary}\n\nWhat are your thoughts on this?`;
        characterLimit = 10000; // Reddit has higher limit
        hashtags = ['discussion', 'technology', 'insights'];
        break;

      case 'linkedin':
        content = `Excited to share: ${title}\n\n${summary}\n\n#ProfessionalDevelopment #Tech #Innovation`;
        hashtags = ['ProfessionalDevelopment', 'Tech', 'Innovation'];
        break;
    }

    posts.push({
      platform,
      content,
      hashtags,
      characterCount: content.length,
      tone: 'professional',
    });
  }

  return posts;
}
