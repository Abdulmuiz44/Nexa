import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // For API routes, we don't set cookies, but this is required
          });
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id) {
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

    const { data, error } = await supabase
      .from('users')
      .update({
        onboarding_data: onboardingData,
        status: 'active',
        updated_at: new Date(),
      })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('Onboarding save error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
