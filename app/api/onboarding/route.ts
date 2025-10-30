import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/auth/auth';

export async function POST(req: Request) {
  try {
    console.log('Onboarding API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));
    console.log('Session user:', session?.user);
    console.log('Session user ID:', session?.user?.id);

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await req.json();
    console.log('Request data:', requestData);
    const { businessName, businessType, websiteUrl, promotionGoals, postingFrequency, brandTone, sampleCaption } = requestData;

    const onboardingData = {
      business_name: businessName,
      business_type: businessType,
      website_url: websiteUrl,
      promotion_goals: promotionGoals,
      posting_frequency: postingFrequency,
      brand_tone: brandTone,
      sample_caption: sampleCaption,
    };

    console.log('Updating user with ID:', session.user.id);
    console.log('Onboarding data:', onboardingData);

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

    console.log('Onboarding completed successfully');
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }, { status: 500 });
  }
}
