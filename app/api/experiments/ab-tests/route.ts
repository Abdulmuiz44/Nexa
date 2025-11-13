import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's A/B tests
    const { data: tests, error } = await supabaseClient
      .from('ab_tests')
      .select(`
        *,
        variants:ab_test_variants(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching A/B tests:', error);
      return NextResponse.json({ tests: [] });
    }

    // Transform data for frontend
    const transformedTests = (tests || []).map(test => ({
      id: test.id,
      name: test.name,
      status: test.status,
      platform: test.platform,
      variants: test.variants || [],
      winner: test.winner_variant_id,
      startDate: test.start_date,
      endDate: test.end_date,
      totalImpressions: (test.variants || []).reduce((sum, v) => sum + (v.impressions || 0), 0),
      totalEngagements: (test.variants || []).reduce((sum, v) => sum + (v.engagements || 0), 0),
      created_at: test.created_at,
    }));

    return NextResponse.json({ tests: transformedTests });
  } catch (error) {
    console.error('Error in A/B tests:', error);
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
    const { name, platform, variants, userId: requestUserId } = await request.json();

    if (requestUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || !platform || !variants || variants.length < 2) {
      return NextResponse.json({ error: 'Invalid test data' }, { status: 400 });
    }

    // Create the A/B test
    const { data: test, error: testError } = await supabaseClient
      .from('ab_tests')
      .insert({
        user_id: userId,
        name,
        platform,
        status: 'draft',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (testError) {
      console.error('Error creating A/B test:', testError);
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
    }

    // Create test variants
    const variantsData = variants.map((variant: any, index: number) => ({
      test_id: test.id,
      variant_name: `Variant ${index + 1}`,
      content: variant.content,
      headline: variant.headline || null,
      impressions: 0,
      engagements: 0,
      engagement_rate: 0,
    }));

    const { error: variantsError } = await supabaseClient
      .from('ab_test_variants')
      .insert(variantsData);

    if (variantsError) {
      console.error('Error creating test variants:', variantsError);
      // Clean up the test if variants creation failed
      await supabaseClient.from('ab_tests').delete().eq('id', test.id);
      return NextResponse.json({ error: 'Failed to create test variants' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      test: {
        ...test,
        variants: variantsData,
      }
    });
  } catch (error) {
    console.error('Error creating A/B test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
