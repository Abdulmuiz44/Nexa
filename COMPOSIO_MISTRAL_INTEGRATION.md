# Composio + Mistral AI Social Media Integration Guide

## Overview
Complete integration of Composio SDK (250+ apps) with Mistral AI for autonomous social media posting on Twitter/X, Reddit, and LinkedIn.

## Architecture

```
User Chat Interface
       ↓
Mistral AI Agent (mistral-large-latest)
       ↓
Agent State Manager (LangGraph)
       ↓
Composio Integration Service
       ├─ Twitter/X Handler
       ├─ Reddit Handler
       └─ LinkedIn Handler
       ↓
Supabase (User Connections, Posts, Analytics)
```

## Files Structure

### Core Integration Files
- `lib/composio/index.ts` - Composio client initialization
- `lib/composio/twitter.ts` - Twitter/X toolkit wrapper
- `lib/composio/reddit.ts` - Reddit toolkit wrapper
- `lib/composio/linkedin.ts` - LinkedIn toolkit wrapper
- `src/services/composioIntegration.ts` - Enhanced integration service (UPDATED)
- `lib/agents/growthAgent.ts` - Autonomous growth agent (UPDATED)
- `lib/agents/workflow.ts` - LangGraph workflow (UPDATED)

### API Routes
- `app/api/composio/auth/[platform].ts` - OAuth initiation
- `app/api/composio/callback.ts` - OAuth callback handler
- `app/api/composio/post.ts` - Post creation endpoint
- `app/api/composio/schedule.ts` - Schedule post endpoint
- `app/api/composio/connections.ts` - List connections

### Database
- `supabase/migrations/composio_schema.sql` - Schema updates

### Types
- `types/composio.ts` - Type definitions

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @composio/core @mistralai/mistralai
```

### 2. Environment Variables
```env
COMPOSIO_API_KEY=your_api_key
COMPOSIO_AUTH_CONFIG_ID=your_auth_config_id
MISTRAL_API_KEY=your_mistral_key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup
Run migration: `supabase/migrations/20251110_social_media_integration.sql`

### 4. Features Implemented

#### ✅ User Connection Management
- OAuth flow for Twitter/X, Reddit, LinkedIn
- Connection status tracking
- Secure token storage in Supabase

#### ✅ Content Generation with Mistral
- Platform-specific content generation
- User pattern analysis
- Tone/style customization
- Max length constraints per platform

#### ✅ Autonomous Posting
- Post to connected platforms
- Schedule posts for later
- Real-time status updates

#### ✅ Analytics
- Engagement metrics tracking
- Post performance analysis
- User pattern identification

#### ✅ Agent Orchestration
- LangGraph-based workflow
- Multi-step execution (generate → publish → analyze)
- Streaming updates to UI

## Usage Examples

### 1. Generate and Post Content
```typescript
const workflow = await executeWorkflow({
  userId: 'user-id',
  userBrief: 'AI breakthroughs this week',
  toolkits: ['twitter', 'reddit'],
  executionLog: [],
  timestamp: Date.now(),
});
```

### 2. Schedule Post
```typescript
await composioService.schedulePost(
  'twitter',
  { content: 'Hello world' },
  new Date(Date.now() + 3600000) // 1 hour from now
);
```

### 3. Stream Workflow Updates
```typescript
for await (const state of streamWorkflow({
  userId: 'user-id',
  userBrief: 'Topic',
  toolkits: ['twitter'],
  executionLog: [],
  timestamp: Date.now(),
})) {
  console.log(state);
}
```

## Composio Integration Details

### Tool Mapping
- `TWITTER_CREATION_OF_A_POST` → Post tweet
- `TWITTER_LIKE_A_POST` → Like tweet
- `TWITTER_RETWEET` → Retweet
- `REDDIT_SUBMIT_TEXT_POST` → Post to Reddit
- `REDDIT_SUBMIT_LINK_POST` → Share link on Reddit
- `LINKEDIN_POST_CREATION` → Post to LinkedIn

### Connection Model
```typescript
{
  id: string;
  user_id: string;
  composio_connection_id: string;
  toolkit_slug: 'twitter' | 'reddit' | 'linkedin';
  account_username: string;
  account_id: string;
  status: 'active' | 'inactive';
  metadata: Record<string, any>;
  created_at: timestamp;
  updated_at: timestamp;
}
```

## Error Handling

All functions return structured responses:
```typescript
{
  success: boolean;
  message: string;
  error?: string;
  data?: any;
}
```

## Best Practices

1. **Rate Limiting**: Composio enforces API limits - implement queue for high volume
2. **Token Management**: Store tokens securely, refresh as needed
3. **Error Recovery**: Implement exponential backoff for failed posts
4. **User Preferences**: Store in `users.onboarding_data` for agent config
5. **Audit Trail**: Log all actions to `activity_log` table

## Security

- OAuth tokens stored in Supabase encrypted columns
- RLS policies on all connection tables
- User can only access their own connections
- API key stored in environment variables only

## Next Steps

1. [ ] Implement webhook for real-time engagement notifications
2. [ ] Add support for image/video uploads
3. [ ] Implement auto-engagement features
4. [ ] Add analytics dashboard
5. [ ] Implement credit system for usage tracking

## References
- https://docs.composio.dev/sdk/core/quickstart
- https://docs.composio.dev/sdk/core/authentication
- https://docs.composio.dev/sdk/core/tools
