# Nexa Social Media Integration - Developer Documentation

## Implementation Overview

This document explains the technical implementation of Nexa's comprehensive social media integration with X (Twitter) and Reddit through Composio.

## Architecture

### Service Layer

#### 1. ComposioIntegrationService (`/src/services/composioIntegration.ts`)

The core integration service that handles all Composio API interactions.

**Key Features:**
- OAuth 2.0 authentication flows
- Tweet and Reddit post creation
- Content analysis using OpenAI GPT-4
- Pattern detection and learning
- Auto-engagement capabilities
- Scheduling and queuing

**Main Methods:**

```typescript
// Authentication
async initiateTwitterConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }>
async initiateRedditConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }>
async getConnection(platform: 'twitter' | 'reddit'): Promise<any>

// Twitter Operations
async postTweet(tweetData: TweetData): Promise<{ success: boolean; tweetId?: string; url?: string }>
async searchUserTweets(query?: string, maxResults: number = 100): Promise<any[]>
async getTweetAnalytics(tweetId: string): Promise<any>

// Analysis
async analyzeTweet(tweetContent: string): Promise<TweetAnalysis>
async analyzeUserTweetPatterns(): Promise<UserTweetPattern>

// Content Generation
async generateTweetInUserStyle(topic: string, context?: string): Promise<string>

// Engagement
async autoEngageWithTweet(tweetId: string, engagementType: 'like' | 'retweet' | 'reply', replyContent?: string)

// Reddit Operations
async postToReddit(postData: RedditPostData): Promise<{ success: boolean; postId?: string; url?: string }>

// Scheduling
async schedulePost(platform: 'twitter' | 'reddit', content: any, scheduledAt: Date)
```

**Implementation Details:**

1. **OAuth Flow:**
   - Uses Composio's `connectedAccounts.initiate()` method
   - Returns auth URL and connection ID
   - Callback handler saves connection to database

2. **Tweet Analysis:**
   - Uses OpenAI GPT-4 with JSON response format
   - Extracts: sentiment, topics, hooks, style, voice, structure, engagement potential
   - Results cached in user's onboarding_data

3. **Pattern Detection:**
   - Fetches up to 100 recent tweets
   - Analyzes each tweet individually
   - Aggregates patterns using GPT-4
   - Saves patterns to user profile

4. **Content Generation:**
   - Retrieves user's analyzed patterns
   - Uses patterns as context for GPT-4
   - Generates content matching user's authentic voice
   - Respects platform character limits

#### 2. AutonomousAgent (`/src/services/autonomousAgent.ts`)

Background agent that runs continuously for each user.

**Architecture:**

```
AutonomousAgent
├── Posting Loop (runs every hour)
│   ├── Check schedule
│   ├── Generate content in user's style
│   └── Post to platform
└── Engagement Loop (runs every 10 minutes)
    ├── Find relevant content
    ├── Analyze for relevance
    ├── Auto-engage based on rules
    └── Rate limit between actions
```

**Configuration:**

```typescript
interface AutonomousAgentConfig {
  userId: string;
  platforms: ('twitter' | 'reddit')[];
  autoPostEnabled: boolean;
  autoEngageEnabled: boolean;
  postingFrequency: 'hourly' | 'daily' | 'twice_daily' | 'custom';
  customSchedule?: string[]; // ['09:00', '15:00', '21:00']
  engagementRules: {
    autoLike: boolean;
    autoRetweet: boolean;
    autoReply: boolean;
    minEngagementScore: number; // 0-100
  };
  contentTopics: string[];
  targetAudience: string;
}
```

**Main Methods:**

```typescript
async start(): Promise<void>
async stop(): Promise<void>
private runEngagementLoop(): Promise<void>
private runPostingLoop(): Promise<void>
private shouldPostNow(): Promise<boolean>
private generateAndPost(): Promise<void>
private performAutoEngagement(): Promise<void>
```

**Implementation Details:**

1. **Dual-Loop Architecture:**
   - Posting loop: hourly checks, posts based on schedule
   - Engagement loop: 10-minute intervals, finds and engages with content

2. **Smart Scheduling:**
   ```typescript
   // Example: Daily posting at 9 AM
   if (lastPostWasMoreThan24HoursAgo && currentHour === 9) {
     await generateAndPost();
   }
   ```

3. **AI-Powered Engagement:**
   - Each potential engagement opportunity scored 0-100
   - Only engages if score >= minEngagementScore
   - Uses OpenAI to determine best engagement type
   - Generates contextual replies

4. **Rate Limiting:**
   - 5-second delay between engagements
   - Respects platform API limits
   - Logs all actions for audit trail

#### 3. AutonomousAgentManager

Singleton manager for multi-user coordination.

```typescript
class AutonomousAgentManager {
  private static agents: Map<string, AutonomousAgent> = new Map();
  
  static async createAgent(userId: string): Promise<AutonomousAgent>
  static async startAgent(userId: string): Promise<void>
  static async stopAgent(userId: string): Promise<void>
  static getAgent(userId: string): AutonomousAgent | undefined
}
```

### API Layer

#### Autonomous Agent Endpoints

**POST /api/agent/autonomous**
```typescript
// Start agent for authenticated user
Request: {}
Response: {
  success: boolean;
  message: string;
}
```

**DELETE /api/agent/autonomous**
```typescript
// Stop agent for authenticated user
Request: {}
Response: {
  success: boolean;
  message: string;
}
```

**GET /api/agent/autonomous**
```typescript
// Get agent status
Request: {}
Response: {
  isRunning: boolean;
  status: 'active' | 'stopped';
}
```

#### Twitter Endpoints

**POST /api/twitter/analyze**
```typescript
// Analyze a tweet's characteristics
Request: {
  tweetContent: string;
}
Response: {
  success: boolean;
  analysis: {
    sentiment: string;
    topics: string[];
    hooks: string[];
    style: string;
    voice: string;
    structure: string;
    engagement_potential: number;
  }
}
```

**GET /api/twitter/patterns**
```typescript
// Analyze user's tweet patterns
Request: {}
Response: {
  success: boolean;
  patterns: {
    common_hooks: string[];
    typical_structure: string;
    voice_characteristics: string;
    engagement_patterns: {
      best_time: string;
      best_day: string;
      avg_engagement: number;
    };
    content_themes: string[];
  }
}
```

**POST /api/twitter/generate**
```typescript
// Generate tweet in user's style
Request: {
  topic: string;
  context?: string;
}
Response: {
  success: boolean;
  content: string;
}
```

#### Composio Endpoints

**GET /api/composio/start-auth?toolkit=twitter**
- Initiates OAuth flow
- Redirects to Composio auth page

**GET /api/composio/callback**
- OAuth callback handler
- Saves connection to database
- Redirects to dashboard

### Database Schema

#### Enhanced Users Table

```sql
ALTER TABLE users ADD COLUMN onboarding_data JSONB DEFAULT '{}';

-- Example onboarding_data structure:
{
  "tweet_patterns": {
    "common_hooks": ["How to", "Here's why"],
    "typical_structure": "Hook + explanation + CTA",
    "voice_characteristics": "Casual, helpful",
    "engagement_patterns": {
      "best_time": "09:00",
      "best_day": "Tuesday",
      "avg_engagement": 3.5
    },
    "content_themes": ["AI", "productivity"]
  },
  "patterns_analyzed_at": "2025-01-01T00:00:00Z",
  "auto_post_enabled": true,
  "auto_engage_enabled": true,
  "posting_frequency": "daily",
  "custom_schedule": ["09:00", "15:00"],
  "auto_like": true,
  "auto_retweet": false,
  "auto_reply": true,
  "min_engagement_score": 70,
  "content_topics": ["AI", "automation"],
  "target_audience": "tech professionals"
}
```

#### Activity Log Table

```sql
-- Tracks all agent actions
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Common actions:
-- 'agent_started', 'agent_stopped'
-- 'auto_tweet_posted', 'auto_reddit_post'
-- 'auto_like', 'auto_retweet', 'auto_reply'
-- 'post_generation_failed'
```

#### Posts Table Enhancement

```sql
ALTER TABLE posts ADD COLUMN metadata JSONB DEFAULT '{}';

-- Example metadata:
{
  "generated_by": "autonomous_agent",
  "url": "https://twitter.com/i/web/status/123",
  "engagement_score": 85,
  "analysis": {
    "sentiment": "positive",
    "topics": ["AI", "automation"]
  }
}
```

## Worker Process

### start-workers.ts Enhancement

```typescript
// Located at: /scripts/start-workers.ts

// Starts autonomous agents for all enabled users on boot
async function startAutonomousAgents() {
  const { data: users } = await supabaseServer
    .from('users')
    .select('id, onboarding_data')
    .eq('status', 'agent_active');
  
  for (const user of users) {
    if (user.onboarding_data?.auto_post_enabled || 
        user.onboarding_data?.auto_engage_enabled) {
      await AutonomousAgentManager.startAgent(user.id);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  // Stop all agents
  const { data: users } = await supabaseServer
    .from('users')
    .select('id')
    .eq('status', 'agent_active');
  
  for (const user of users) {
    await AutonomousAgentManager.stopAgent(user.id);
  }
  
  process.exit(0);
});
```

## Frontend Components

### AutonomousAgentControl Component

```tsx
// Located at: /components/dashboard/AutonomousAgentControl.tsx

export function AutonomousAgentControl() {
  // Features:
  // 1. Start/Stop agent with single button
  // 2. Display real-time agent status
  // 3. Analyze tweet patterns
  // 4. Show pattern analysis results
  // 5. Re-analyze patterns on demand
}
```

**Usage:**
```tsx
import { AutonomousAgentControl } from '@/components/dashboard/AutonomousAgentControl';

export default function DashboardPage() {
  return (
    <div>
      <AutonomousAgentControl />
    </div>
  );
}
```

## Environment Variables

```bash
# Required
COMPOSIO_API_KEY=your_composio_api_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
NEXTAUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

## Testing

### Manual Testing

1. **Test Twitter Connection:**
```bash
curl -X GET "http://localhost:3000/api/composio/start-auth?toolkit=twitter" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

2. **Test Pattern Analysis:**
```bash
curl -X GET "http://localhost:3000/api/twitter/patterns" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

3. **Test Agent Start:**
```bash
curl -X POST "http://localhost:3000/api/agent/autonomous" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Integration Testing

```typescript
// Example test for pattern analysis
describe('Twitter Pattern Analysis', () => {
  it('should analyze user patterns', async () => {
    const service = new ComposioIntegrationService('user-id');
    const patterns = await service.analyzeUserTweetPatterns();
    
    expect(patterns).toHaveProperty('common_hooks');
    expect(patterns).toHaveProperty('voice_characteristics');
    expect(patterns.engagement_patterns).toHaveProperty('best_time');
  });
});
```

## Deployment

### Production Checklist

1. **Environment Variables:**
   - [ ] Set COMPOSIO_API_KEY
   - [ ] Set OPENAI_API_KEY
   - [ ] Configure Supabase credentials
   - [ ] Set NEXTAUTH_URL to production URL

2. **Database:**
   - [ ] Run migrations
   - [ ] Set up RLS policies
   - [ ] Create indexes on activity_log(user_id, created_at)

3. **Workers:**
   - [ ] Deploy worker process separately
   - [ ] Set up process manager (PM2, systemd)
   - [ ] Configure auto-restart on failure

4. **Monitoring:**
   - [ ] Set up error tracking (Sentry)
   - [ ] Monitor agent activity logs
   - [ ] Track API usage and costs

### Docker Deployment

```dockerfile
# Worker container
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "workers"]
```

### Railway/Render Deployment

```yaml
# render.yaml
services:
  - type: web
    name: nexa-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
  
  - type: worker
    name: nexa-workers
    env: node
    buildCommand: npm install
    startCommand: npm run workers
```

## Troubleshooting

### Common Issues

1. **Agent Not Starting:**
   - Check user has onboarding_data configured
   - Verify Composio connections exist
   - Check logs: `SELECT * FROM activity_log WHERE action = 'agent_started'`

2. **Patterns Analysis Fails:**
   - Ensure user has >20 tweets
   - Verify Twitter connection is active
   - Check OpenAI API key

3. **Auto-Posting Not Working:**
   - Verify posting_frequency in onboarding_data
   - Check last post time: `SELECT * FROM posts WHERE user_id = '...' ORDER BY created_at DESC LIMIT 1`
   - Ensure agent is running: `GET /api/agent/autonomous`

### Debug Mode

Enable debug logging:
```typescript
// In composioIntegration.ts
const DEBUG = process.env.DEBUG_COMPOSIO === 'true';

if (DEBUG) {
  console.log('[Composio] Action:', actionName, 'Params:', params);
}
```

## Performance Considerations

1. **Rate Limiting:**
   - Twitter: 50 requests/minute
   - Reddit: 60 requests/minute
   - Implement exponential backoff

2. **Caching:**
   - Cache pattern analysis for 24 hours
   - Cache connection status for 5 minutes

3. **Scaling:**
   - Use Redis for agent state
   - Implement job queues for posting
   - Horizontal scaling with load balancer

## Future Enhancements

1. **Advanced Analytics:**
   - Engagement prediction models
   - A/B testing for content
   - Sentiment tracking over time

2. **Multi-Platform:**
   - LinkedIn integration
   - Facebook/Instagram support
   - Discord/Slack notifications

3. **AI Improvements:**
   - Fine-tune model on user's content
   - Image generation for tweets
   - Video content suggestions

## Contributing

When adding new features:

1. Update this documentation
2. Add TypeScript types
3. Write integration tests
4. Update API documentation
5. Add error handling
6. Log all actions

## Support

For technical issues:
- Check logs: `docker logs nexa-workers`
- Review activity_log table
- Enable debug mode
- Contact: dev@nexa.ai
