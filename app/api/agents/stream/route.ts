import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { streamWorkflow } from '@/lib/agents/workflow';
import { createLogger } from '@/lib/logger';

const logger = createLogger();

/**
 * POST /api/agents/stream
 * Stream agent workflow execution with Server-Sent Events (SSE)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { brief, toolkits } = body;

    // Validate inputs
    if (!brief || !toolkits || !Array.isArray(toolkits) || toolkits.length === 0) {
      return NextResponse.json(
        {
          error: 'Missing or invalid parameters: brief and toolkits (non-empty array) are required',
        },
        { status: 400 }
      );
    }

    await logger.info('streaming_agent', 'Starting streaming workflow', {
      userId: session.user.id,
      toolkits,
      briefLength: brief.length,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generator to stream workflow events
          for await (const state of streamWorkflow({
            userId: session.user.id,
            userBrief: brief,
            toolkits,
          })) {
            if (isClosed) break;

            // Send state update as SSE
            const data = JSON.stringify({
              type: 'state_update',
              payload: {
                executionLog: state.executionLog,
                contentVariations: state.contentVariations,
                postIds: state.postIds,
                published: state.published,
                metrics: state.metrics,
                error: state.error,
              },
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                payload: { status: 'success' },
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);

          await logger.error('streaming_agent_error', `Streaming failed: ${errorMsg}`, {
            userId: session.user.id,
            error: errorMsg,
          });

          // Send error event
          if (!isClosed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  payload: { error: errorMsg },
                })}\n\n`
              )
            );
          }

          controller.close();
        }
      },

      cancel() {
        isClosed = true;
      },
    });

    // Return SSE response
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await logger.error('streaming_agent_fatal', `Fatal error: ${errorMsg}`, {
      error: errorMsg,
    });

    return NextResponse.json(
      {
        error: 'Streaming failed',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
