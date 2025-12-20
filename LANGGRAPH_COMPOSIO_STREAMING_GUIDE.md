# LangGraph + Composio + Streaming Implementation Guide

## Overview

This guide explains the complete implementation of:
1. **LangGraph Workflow Orchestration** - Multi-step agent workflows
2. **Composio Tool Integration** - Social media posting & analytics
3. **Server-Sent Events (SSE) Streaming** - Real-time UI updates

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useStreamingAgent Hook                              │  │
│  │  - Manages EventSource connection                    │  │
│  │  - Parses SSE events                                 │  │
│  │  - Updates UI state in real-time                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↑
                    SSE (text/event-stream)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Route (Backend)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/agents/stream                             │  │
│  │  - Creates ReadableStream                            │  │
│  │  - Iterates over workflow events                     │  │
│  │  - Sends SSE formatted data                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↑
                    Async Generators
                           ↓
┌─────────────────────────────────────────────────────────────┐
│           LangGraph Workflow Orchestration                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  workflow.ts: buildWorkflowGraph()                   │  │
│  │  ├─ Node: Generate (Content Agent + Mistral)        │  │
│  │  ├─ Node: Publish (Composio Tools)                  │  │
│  │  └─ Node: Analytics (Fetch Metrics)                 │  │
│  │                                                      │  │
│  │  Edges connect nodes with routing logic             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        ↑              ↑                    ↑
        │              │                    │
   ┌────┴───┐  ┌──────┴────┐      ┌────────┴──────┐
   │Mistral │  │ Composio  │      │   Supabase    │
   │  API   │  │   Tools   │      │   Logger      │
   └────────┘  └───────────┘      └───────────────┘
```

## Files Created

### 1. **lib/agents/workflow.ts** - LangGraph Orchestration
- Defines `WorkflowState` interface
- Creates nodes:
  - `nodeGenerateContent` - Uses Content Agent
  - `nodePublishContent` - Uses Composio tools
  - `nodeAnalytics` - Fetches metrics
- Defines routing logic with conditional edges
- Exports `buildWorkflowGraph()` and `streamWorkflow()`

### 2. **lib/tools/composioTools.ts** - Composio Integration
- Defines tool schemas for LangGraph
- Implements:
  - `postToSocialMedia()` - Post to Twitter/Reddit/LinkedIn
  - `fetchEngagementMetrics()` - Get post analytics
  - `schedulePost()` - Schedule posts for later
  - `executeComposioTool()` - Tool dispatcher

### 3. **app/api/agents/stream/route.ts** - SSE Streaming API
- POST endpoint that streams workflow execution
- Creates `ReadableStream` for SSE
- Sends state updates as `data: {...}\n\n` format
- Handles authentication and error cases

### 4. **hooks/useStreamingAgent.ts** - Frontend Hook
- Manages streaming connection
- Parses SSE events
- Updates local state in real-time
- Methods:
  - `startWorkflow(brief, toolkits)` - Initiate streaming
  - `stopWorkflow()` - Close connection
  - `reset()` - Clear state

## Data Flow

### User Triggers Workflow
```
User Input → useStreamingAgent.startWorkflow()
  ↓
POST /api/agents/stream { brief, toolkits }
  ↓
Server creates ReadableStream (SSE)
```

### Workflow Execution
```
streamWorkflow() async generator
  ↓
For each step in workflow:
  - Execute node (generate/publish/analytics)
  - Yield intermediate state
  - Backend sends: "data: {state}\n\n"
  ↓
Frontend EventListener receives update
  ↓
UI re-renders with new executionLog, metrics, etc.
```

### Example SSE Events

**State Update Event:**
```
data: {"type":"state_update","payload":{"executionLog":["✓ Content generated for twitter, reddit"],"contentVariations":{"twitter":"Tweet content here...","reddit":"Post content here..."}}}

```

**Completion Event:**
```
data: {"type":"complete","payload":{"status":"success"}}

```

**Error Event:**
```
data: {"type":"error","payload":{"error":"Failed to post to twitter"}}

```

## How to Use

### Basic Usage

```typescript
import { useStreamingAgent } from '@/hooks/useStreamingAgent';

function MyComponent() {
  const { loading, error, state, startWorkflow, reset } = useStreamingAgent();

  const handleStart = async () => {
    await startWorkflow('Announce our AI feature', ['twitter', 'reddit']);
  };

  return (
    <div>
      <button onClick={handleStart} disabled={loading}>
        {loading ? 'Running...' : 'Start Workflow'}
      </button>

      {error && <p>Error: {error}</p>}

      <div>
        <h3>Execution Log:</h3>
        {state.executionLog.map((log, idx) => (
          <p key={idx}>{log}</p>
        ))}
      </div>

      {state.contentVariations && (
        <div>
          <h3>Generated Content:</h3>
          {Object.entries(state.contentVariations).map(([platform, content]) => (
            <div key={platform}>
              <h4>{platform}</h4>
              <p>{content}</p>
            </div>
          ))}
        </div>
      )}

      {state.metrics && (
        <div>
          <h3>Metrics:</h3>
          <pre>{JSON.stringify(state.metrics, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Environment Variables

Ensure `.env.local` has:
```env
MISTRAL_API_KEY=your_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
COMPOSIO_API_KEY=your_key (if using Composio)
```

### Workflow Customization

To modify workflow steps, edit `lib/agents/workflow.ts`:

```typescript
// Add a new node
async function nodeYourCustomStep(state: WorkflowState) {
  // Your logic here
  return { /* updated state */ };
}

// Add to graph
workflow.addNode('custom_step', nodeYourCustomStep);

// Connect with edges
workflow.addEdge('publish', 'custom_step');
workflow.addEdge('custom_step', 'analytics');
```

## Performance Considerations

1. **Streaming Overhead**: SSE adds minimal overhead (~50ms per event)
2. **Concurrent Workflows**: Each user gets their own workflow instance
3. **Memory**: Workflow state is recreated per request (no persistence needed)
4. **Timeout**: Set longer timeouts for large workflows (e.g., `maxDuration = 120`)

## Debugging

### Check Server Logs
```bash
# View real-time logs
tail -f dev.log | grep "streaming_agent"
```

### Browser DevTools
1. Open Network tab
2. Filter by XHR/Fetch
3. Click on `/api/agents/stream` request
4. Switch to "EventStream" tab (if available) or watch Response preview

### Manual Testing
```bash
curl -X POST http://localhost:3000/api/agents/stream \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"brief":"Test workflow","toolkits":["twitter"]}'
```

## Common Issues & Solutions

**Issue**: "No messages in execution log"
- **Cause**: Workflow didn't start
- **Fix**: Check authentication, ensure session exists

**Issue**: "EventSource closes immediately"
- **Cause**: Server error or timeout
- **Fix**: Check server logs for errors, increase timeout if needed

**Issue**: "UI doesn't update in real-time"
- **Cause**: Frontend hook not parsing SSE correctly
- **Fix**: Check browser console for parsing errors, verify SSE format

## Next Steps

1. **Add Human-in-the-Loop**: Add interrupts before publishing
2. **Persistent Threads**: Store workflow history in Supabase
3. **Multi-Agent Coordination**: Add engagement & strategy agents
4. **Webhooks**: Notify users when workflows complete
5. **Analytics Dashboard**: Visualize metrics over time

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Composio Tools Catalog](https://docs.composio.dev/toolkits/introduction)
- [Next.js Streaming](https://nextjs.org/docs/app/api-reference/file-conventions/route#streaming)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
