# Content Agent Implementation Guide

## Overview

The Content Agent is a Mistral-powered module that generates platform-specific social media content (Twitter, Reddit, LinkedIn). It's designed as the first agent in Nexa's multi-agent system.

## Files Created

### Backend Implementation

1. **`lib/agents/types.ts`**
   - Type definitions for agent state, requests, responses
   - `AgentState`, `ContentGenerationRequest`, `ContentGenerationResult`

2. **`lib/agents/contentAgent.ts`**
   - Main Content Agent class extending `NexaBase`
   - Methods:
     - `generateContent()` - Main entry point
     - `_generateContentDrafts()` - Per-platform content generation using Mistral
     - `_analyzeContent()` - Engagement potential analysis
     - `executeAction()` - NexaBase interface implementation
     - `getToolSchemas()` - Tool definitions for future LangGraph integration

3. **`app/api/agents/run/route.ts`**
   - POST endpoint: `/api/agents/run`
   - GET endpoint: `/api/agents/run` (list available agents)
   - Handles authentication, validation, logging
   - Integrates with Mistral via ContentAgent

### Frontend Implementation

1. **`hooks/useContentAgent.ts`**
   - React hook for managing agent state
   - Handles loading, errors, results, execution log
   - Methods:
     - `generateContent()` - Async content generation
     - `reset()` - Clear state

2. **`components/agents/ContentAgentUI.tsx`**
   - Full-featured UI component
   - Inputs: Brief, platform selection, tone, context
   - Outputs: Generated content per platform + analysis
   - Real-time execution log display

3. **`app/dashboard/agent-demo/page.tsx`**
   - Demo page accessible at `/dashboard/agent-demo`
   - Protected by authentication
   - Showcases ContentAgentUI component

## How to Test

### 1. Start the dev server
```bash
npm run dev
```

### 2. Navigate to the demo
```
http://localhost:3000/dashboard/agent-demo
```

### 3. Fill in the form
- **Content Brief**: e.g., "We just launched an AI social media manager called Nexa"
- **Platforms**: Select Twitter and/or Reddit
- **Tone**: Choose from Professional, Casual, Humorous
- **Context** (optional): Any specific details or constraints

### 4. Click "Generate Content"
- Watch the execution log show progress
- View generated content for each platform
- See AI analysis of engagement potential

### 5. Direct API Test (curl)
```bash
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Announce our new Nexa product launch",
    "toolkits": ["twitter", "reddit"],
    "tone": "professional",
    "additionalContext": "Target AI enthusiasts"
  }'
```

## Architecture Flow

```
UI (ContentAgentUI)
    ↓
useContentAgent Hook
    ↓
POST /api/agents/run
    ↓
ContentAgent.generateContent()
    ↓
For each platform:
  - Build prompt
  - Call Mistral API
  - Generate platform-specific content
    ↓
Analyze content (Mistral)
    ↓
Return results + metadata
    ↓
UI displays results
```

## Next Steps

### Phase 2: Multi-Agent Orchestration
- Create additional agents (Engagement, Analytics, Scheduling)
- Implement LangGraph for workflow orchestration
- Add tool calling for Composio integration

### Phase 3: Streaming & Real-time Updates
- Add Server-Sent Events (SSE) for real-time progress
- Stream token-by-token from Mistral
- Update UI as agent executes

### Phase 4: CopilotKit Integration
- Wrap agents with CopilotKit `useAgent` hook
- Add chat interface for agentic interactions
- Enable approval/rejection at each step

## Environment Variables Required

Ensure `.env.local` has:
```env
MISTRAL_API_KEY=your_mistral_api_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

## Troubleshooting

**Issue**: "MISTRAL_API_KEY environment variable is required"
- **Fix**: Add `MISTRAL_API_KEY` to `.env.local`

**Issue**: Content generation returns empty
- **Fix**: Check Mistral API quota/rate limits
- **Fix**: Verify API key is valid
- **Fix**: Check console logs for detailed error messages

**Issue**: Component shows "Unauthorized"
- **Fix**: Make sure you're logged in
- **Fix**: Check session is valid

## Cost Estimates

- Content generation (1 platform): ~0.002 USD
- Content generation (3 platforms): ~0.006 USD
- Analysis: ~0.001 USD
- Typical workflow: ~0.01 USD per execution

## References

- **Mistral Docs**: https://docs.mistral.ai/
- **Nexa Roadmap**: See NEXA_ROADMAP.md
- **Agent Architecture**: See architecture diagram in implementation thread
