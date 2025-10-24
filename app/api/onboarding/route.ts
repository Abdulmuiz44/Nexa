import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessName, businessType, websiteUrl, promotionGoals, postingFrequency, brandTone, sampleCaption } = await req.json();

    const onboardingData = {
      business_name: businessName,
      business_type: businessType,
      website_url: websiteUrl,
      promotion_goals: promotionGoals,
      posting_frequency: postingFrequency,
      brand_tone: brandTone,
      sample_caption: sampleCaption,
    };

    const { error } = await supabaseServer
      .from('users')
      .update({
        onboarding_data: onboardingData,
        status: 'active',
        updated_at: new Date(),
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Onboarding save error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }, { status: 500 });
  }
}
