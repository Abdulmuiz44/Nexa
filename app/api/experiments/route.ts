import { NextRequest, NextResponse } from 'next/server';
import { ExperimentsService } from '@/lib/services/experimentsService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
} else {
  console.warn('Supabase environment variables not set - experiments API will not function');
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const experimentId = searchParams.get('experiment_id');

    if (action === 'list') {
      const status = searchParams.get('status') as any;
      const experiments = await ExperimentsService.getExperiments(user.id, status);
      return NextResponse.json({ experiments });
    }

    if (action === 'details' && experimentId) {
      const details = await ExperimentsService.getExperimentDetails(experimentId);
      return NextResponse.json(details);
    }

    if (action === 'analyze' && experimentId) {
      const results = await ExperimentsService.analyzeExperiment(experimentId);
      return NextResponse.json({ results });
    }

    if (action === 'recommendations') {
      const recommendations = await ExperimentsService.getExperimentRecommendations(user.id);
      return NextResponse.json({ recommendations });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Experiments GET error:', error);
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
    const { action } = body;

    if (action === 'create') {
      const experiment = await ExperimentsService.createExperiment({
        ...body,
        user_id: user.id,
        status: 'draft',
        results_summary: {}
      });
      return NextResponse.json({ success: true, experiment });
    }

    if (action === 'start') {
      const experiment = await ExperimentsService.startExperiment(body.experiment_id);
      return NextResponse.json({ success: true, experiment });
    }

    if (action === 'cancel') {
      await ExperimentsService.cancelExperiment(body.experiment_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Experiments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experiment_id');

    if (!experimentId) {
      return NextResponse.json({ error: 'Missing experiment_id' }, { status: 400 });
    }

    await ExperimentsService.deleteExperiment(experimentId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Experiments DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
