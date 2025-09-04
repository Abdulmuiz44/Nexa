// NEXA - Automated Cron Job API Route
// This endpoint will be called by Vercel Cron Jobs for automation

import { NextRequest, NextResponse } from 'next/server';
import { nexaOrchestrator } from '../../../lib/core/nexa-orchestrator';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (or local development)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Cron job triggered at:', new Date().toISOString());

    // Run the main orchestration
    await nexaOrchestrator.orchestrate();

    return NextResponse.json({ 
      success: true, 
      message: 'Nexa orchestration completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Manual trigger endpoint for testing
    const body = await request.json();
    
    if (body.action === 'test') {
      console.log('🧪 Manual test trigger');
      await nexaOrchestrator.orchestrate();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test orchestration completed',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('❌ Manual trigger failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;