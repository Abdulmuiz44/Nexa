import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CalendarGenerator } from '@/lib/services/calendarGenerator';
import { supabaseServer } from '@/src/lib/supabaseServer';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        let { topics, platforms, days } = body;

        // If topics not provided, try to fetch from user onboarding data
        if (!topics || topics.length === 0) {
            const { data: user } = await supabaseServer
                .from('users')
                .select('onboarding_data')
                .eq('id', userId)
                .single();

            topics = user?.onboarding_data?.content_topics || user?.onboarding_data?.promotion_goals || ['marketing', 'technology', 'AI'];
        }

        if (!platforms || platforms.length === 0) {
            platforms = ['twitter'];
        }

        const generator = new CalendarGenerator(userId);
        const result = await generator.generate30DayCalendar({
            userId,
            topics,
            platforms,
            days: days || 30
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Successfully generated ${result.postCount} posts for the next ${days || 30} days.`,
                postCount: result.postCount
            });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Calendar generation API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
