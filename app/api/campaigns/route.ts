import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { createCampaignSchema, campaignFilterSchema } from '@/lib/schemas/campaigns';
import { validateBody, validateQuery } from '@/lib/api/validation';
import { apiSuccess, apiError, apiCreated, apiUnauthorized, apiNotFound } from '@/lib/api/response';
import { getAuthenticatedUser } from '@/lib/api/auth-middleware';

// GET /api/campaigns - List user's campaigns
export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || undefined;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiUnauthorized('Authentication required', requestId);
    }

    // Validate query parameters
    const { data: query, error: queryError } = validateQuery(
      req.nextUrl.searchParams,
      campaignFilterSchema,
      requestId
    );

    if (queryError) {
      return queryError;
    }

    // Fetch campaigns
    let campaignsQuery = supabaseServer
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (query?.status) {
      campaignsQuery = campaignsQuery.eq('status', query.status);
    }

    if (query?.objective) {
      campaignsQuery = campaignsQuery.eq('objective', query.objective);
    }

    if (query?.platform) {
      campaignsQuery = campaignsQuery.contains('platforms', [query.platform]);
    }

    // Apply pagination
    const limit = query?.limit || 20;
    const offset = query?.offset || 0;
    campaignsQuery = campaignsQuery.range(offset, offset + limit - 1);

    const { data: campaigns, error, count } = await campaignsQuery;

    if (error) {
      console.error('Error fetching campaigns:', error);
      return apiError('Failed to fetch campaigns', 500, 'DATABASE_ERROR', requestId);
    }

    return apiSuccess(
      {
        campaigns: campaigns || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
        },
      },
      200,
      'CAMPAIGNS_FETCHED',
      requestId
    );
  } catch (error: unknown) {
    console.error('Campaigns GET error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(message, 500, 'INTERNAL_ERROR', requestId);
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || undefined;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser();
    if (!user) {
      return apiUnauthorized('Authentication required', requestId);
    }

    // Validate request body
    const { data: body, error: validationErr } = await validateBody(req, createCampaignSchema, requestId);

    if (validationErr) {
      return validationErr;
    }

    if (!body) {
      return apiError('Invalid request body', 400, 'BAD_REQUEST', requestId);
    }

    // Create campaign
    const { data: campaign, error } = await supabaseServer
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description,
        objective: body.objective,
        platforms: body.platforms,
        budget: body.budget,
        status: 'draft',
        start_date: body.start_date,
        end_date: body.end_date,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return apiError('Failed to create campaign', 500, 'DATABASE_ERROR', requestId);
    }

    return apiCreated(campaign, requestId);
  } catch (error: unknown) {
    console.error('Campaigns POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError(message, 500, 'INTERNAL_ERROR', requestId);
  }
}
