import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, topic, count = 1, scheduledTime } = await req.json();

    if (!platform || !['twitter', 'reddit'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform. Must be twitter or reddit.' }, { status: 400 });
    }

    // TODO: Implement content generation
    // For now, return placeholder content
    const placeholderContent = `🚀 Exciting news! Just launched our latest ${topic} feature that will revolutionize how you ${platform === 'twitter' ? 'connect with your audience' : 'engage with your community'}.

What do you think? Drop your thoughts below! 💬

#${topic.replace(/\s+/g, '')} #Innovation #Tech`;

    if (count > 1) {
      // Generate multiple posts
      const contents = Array(count).fill(null).map((_, i) =>
        `${placeholderContent} - Post ${i + 1}`
      );
      return NextResponse.json({
        success: true,
        contents,
        count: contents.length,
      });
    } else {
      return NextResponse.json({
        success: true,
        post: placeholderContent,
        scheduled: !!scheduledTime,
      });
    }
  } catch (error: unknown) {
    console.error('Content generation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate content'
    }, { status: 500 });
  }
}
