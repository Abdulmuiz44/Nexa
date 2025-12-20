# Nexa AI Agents - Quick Reference

## Quick Links

| What | Where |
|------|-------|
| **Demo Hub** | `/dashboard/agents` |
| **Content Agent Demo** | `/dashboard/agent-demo` |
| **Workflow Demo** | `/dashboard/workflow-demo` |
| **Full Guide** | `AGENTS_IMPLEMENTATION_GUIDE.md` |
| **Implementation Summary** | `IMPLEMENTATION_SUMMARY.md` |

---

## One-Minute Setup

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
MISTRAL_API_KEY=sk-xxx
COMPOSIO_API_KEY=xxx
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=xxx

# 3. Start dev server
npm run dev

# 4. Open browser
http://localhost:3000/dashboard/agents
```

---

## File Structure

```
lib/agents/
├── types.ts              # Shared interfaces
├── index.ts              # Factory exports
├── nexaBase.ts           # Base class
├── contentAgent.ts       # Content generation (PRIMARY)
├── workflow.ts           # LangGraph orchestration (PRIMARY)
└── analyticsAgent.ts     # Analytics tracking

lib/tools/
└── composioTools.ts      # Social media API wrapper

app/api/agents/
├── run/route.ts          # POST /api/agents/run
└── stream/route.ts       # POST /api/agents/stream (PRIMARY)

components/agents/
├── ContentAgentUI.tsx    # Single generation UI
└── WorkflowUI.tsx        # Workflow orchestration UI (PRIMARY)

hooks/
├── useContentAgent.ts    # Single generation hook
└── useStreamingAgent.ts  # Workflow streaming hook (PRIMARY)

app/dashboard/
├── agents/page.tsx       # NEW: Agents hub
├── agent-demo/           # Content agent demo
└── workflow-demo/        # Workflow demo (PRIMARY)
```

---

## API Endpoints

### Generate Content Only
```bash
POST /api/agents/run
Content-Type: application/json

{
  "brief": "string",
  "toolkits": ["twitter", "reddit", "linkedin"],
  "tone": "professional|casual|humorous"
}

Response: { twitter: "...", reddit: "...", linkedin: "..." }
```

### Full Workflow (Streaming)
```bash
POST /api/agents/stream
Content-Type: application/json

{
  "brief": "string",
  "toolkits": ["twitter", "reddit"]
}

Response: Server-Sent Events (text/event-stream)
Event types: state_update, complete, error
```

---

## Key Components

### ContentAgentUI
**Use for:** Single content generation
```tsx
<ContentAgentUI />
```

### WorkflowUI
**Use for:** Full workflow (generate → publish → analyze)
```tsx
<WorkflowUI />
```

---

## React Hooks

### useStreamingAgent()
**For:** Real-time workflow streaming
```tsx
const { loading, error, state, startWorkflow, stopWorkflow, reset } = useStreamingAgent();
```

### useContentAgent()
**For:** Single content generation
```tsx
const { loading, error, result, generateContent, reset } = useContentAgent();
```

---

## Core Functions

### getContentAgent(userId)
**Returns:** ContentAgent instance
```tsx
const agent = getContentAgent(userId);
const result = await agent.generateContent({
  userId,
  brief: "...",
  toolkits: ["twitter"],
  tone: "professional"
});
```

### executeWorkflow(state)
**Returns:** Async generator yielding state updates
```tsx
for await (const state of executeWorkflow({ userId, userBrief, toolkits })) {
  console.log('Update:', state);
}
```

### streamWorkflow(params)
**Returns:** Async generator for SSE streaming
```tsx
for await (const state of streamWorkflow({ userId, userBrief, toolkits })) {
  yield state;
}
```

### executeComposioTool(toolName, params)
**Returns:** Tool execution result
```tsx
const result = await executeComposioTool('post_to_social_media', {
  userId,
  platform: 'twitter',
  content: '...'
});
```

---

## State Structure

### ContentGenerationResult
```typescript
{
  twitter?: string;
  reddit?: string;
  linkedin?: string;
  metadata?: {
    analysis: string;
    engagement_potential: number;
  };
}
```

### WorkflowState
```typescript
{
  userId: string;
  userBrief: string;
  toolkits: string[];
  contentVariations?: Record<string, string>;
  postIds?: string[];
  published?: boolean;
  metrics?: Record<string, any>;
  executionLog: string[];
  error?: string;
}
```

### StreamingState
```typescript
{
  executionLog: string[];
  contentVariations?: Record<string, string>;
  postIds?: string[];
  published?: boolean;
  metrics?: Record<string, any>;
  error?: string;
}
```

---

## Environment Variables

| Variable | Required | Example |
|----------|----------|---------|
| `MISTRAL_API_KEY` | ✅ | `sk-xxx` |
| `COMPOSIO_API_KEY` | ✅ | `xxx` |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | ✅ | Random string |
| `LOG_LEVEL` | ❌ | `debug` |

---

## Common Tasks

### Generate content programmatically
```typescript
const agent = getContentAgent(userId);
const result = await agent.generateContent({
  userId,
  brief: "New product launch",
  toolkits: ["twitter", "linkedin"],
  tone: "professional"
});
```

### Start streaming workflow in component
```typescript
const { startWorkflow } = useStreamingAgent();
await startWorkflow("Launch announcement", ["twitter", "reddit"]);
```

### Publish to specific platform
```typescript
const result = await executeComposioTool('post_to_social_media', {
  userId,
  platform: 'twitter',
  content: 'My tweet here'
});
```

### Custom agent creation
```typescript
import { NexaBase } from '@/lib/agents/nexaBase';

class CustomAgent extends NexaBase {
  async run(input: string) {
    // Custom implementation
  }
}
```

---

## Testing Checklist

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Dev server running (`npm run dev`)
- [ ] Can access `/dashboard/agents`
- [ ] Can access `/dashboard/agent-demo`
- [ ] Can access `/dashboard/workflow-demo`
- [ ] Content generation works
- [ ] Workflow streams in real-time
- [ ] Errors handled gracefully
- [ ] Mobile responsive

---

## Troubleshooting

**Q: Stream endpoint 401 error**
A: Check authentication token, verify NEXTAUTH_SECRET

**Q: Content not generating**
A: Verify MISTRAL_API_KEY is set and valid

**Q: Publishing fails**
A: Check COMPOSIO_API_KEY and social media credentials

**Q: UI doesn't update in real-time**
A: Check browser console for errors, verify SSE connection

**Q: TypeScript errors**
A: Run `npm install` to ensure LangChain packages are installed

---

## Performance Targets

- Content generation: 5-10s
- Content publishing: 2-3s per platform
- UI update: <100ms
- Full workflow (3 platforms): 20-30s

---

## Documentation

| File | Purpose |
|------|---------|
| `AGENTS_IMPLEMENTATION_GUIDE.md` | Complete implementation guide |
| `AGENTS_QUICK_REFERENCE.md` | This file - quick lookup |
| `IMPLEMENTATION_SUMMARY.md` | High-level overview |
| `LANGGRAPH_COMPOSIO_STREAMING_GUIDE.md` | Architecture & streaming |
| `TESTING_WORKFLOW_E2E.md` | Testing scenarios |

---

## Dependencies

```json
{
  "@langchain/core": "^0.3.0",
  "@langchain/langgraph": "^0.1.0",
  "@mistralai/mistralai": "^1.10.0",
  "@composio/core": "^0.2.4"
}
```

---

**Last Updated:** December 20, 2025
