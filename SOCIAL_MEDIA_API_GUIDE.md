# Nexa Social Media Integration - Complete Implementation Guide

## Overview

This document provides a complete guide to the Nexa social media integration system, including OAuth authentication, API endpoints, autonomous agent capabilities, and chat integration.

## Table of Contents

1. [Architecture](#architecture)
2. [OAuth Connection Flow](#oauth-connection-flow)
3. [API Endpoints](#api-endpoints)
4. [Chat Agent Integration](#chat-agent-integration)
5. [Autonomous Agent](#autonomous-agent)
6. [Testing Guide](#testing-guide)
7. [Deployment](#deployment)

## Architecture

```
┌─────────────────┐
│  User (Browser) │
└────────┬────────┘
         │
         ├──> /dashboard/connections (Connect Accounts)
         │
         ├──> /chat (Chat with AI Agent)
         │
         └──> API Endpoints
              │
              ├──> /api/composio/* (OAuth & Connections)
              │
              ├──> /api/social/* (Twitter/Reddit Actions)
              │
              └──> /api/agent/* (Autonomous Agent Control)
                   │
                   ├──> ComposioIntegrationService
                   │    │
                   │    ├──> Composio API (OAuth & Actions)
                   │    │
                   │    └──> Twitter/Reddit APIs
                   │
                   └──> OpenAI GPT-4 (Analysis & Generation)
```

## OAuth Connection Flow

### Step 1: User Initiates Connection

User clicks "Connect Twitter" on `/dashboard/connections`:

```javascript
// Frontend triggers OAuth flow
window.location.href = `/api/composio/start-auth?toolkit=twitter`;
```

### Step 2: OAuth Initiation

`/api/composio/start-auth` route:

```typescript
// 1. Authenticate user
const session = await getServerSession(authOptions);
const userId = session.user.id;

// 2. Initialize Composio service
const composioService = new ComposioIntegrationService(userId);

// 3. Initiate OAuth with Composio
const { authUrl, connectionId } = await composioService.initiateTwitterConnection();

// 4. Redirect user to Composio OAuth page
return NextResponse.redirect(authUrl);
```

### Step 3: User Authorizes

- User is redirected to Composio's OAuth page
- Composio handles Twitter OAuth
- User authorizes the application

### Step 4: OAuth Callback

Composio redirects back to `/api/composio/callback?connectionId=...&integrationId=...&entityId=...`:

```typescript
// 1. Extract OAuth parameters
const { connectionId, integrationId, entityId } = extractParams(req.url);

// 2. Verify connection with Composio
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const account = await composio.connectedAccounts.get({ connectedAccountId: connectionId });

// 3. Save to database
await supabaseServer.from('composio_connections').insert({
  user_id: entityId,
  composio_connection_id: connectionId,
  toolkit_slug: integrationId,
  meta: { status: 'ACTIVE', createdAt: new Date().toISOString() }
});

// 4. Redirect back to connections page
return NextResponse.redirect('/dashboard/connections?connected=twitter');
```

### Step 5: Connection Verified

User sees success message and "Connected" badge with active status.

## API Endpoints

### Twitter Endpoints

#### POST /api/social/twitter/post

Post a tweet to Twitter.

**Request:**
```json
{
  "content": "Hello from Nexa! 🚀",
  "replyToTweetId": "optional_tweet_id",
  "quoteTweetId": "optional_tweet_id",
  "mediaUrls": ["optional_media_url"]
}
```

**Response:**
```json
{
  "success": true,
  "tweetId": "1234567890",
  "url": "https://twitter.com/user/status/1234567890",
  "message": "Tweet posted successfully"
}
```

#### GET /api/social/twitter/timeline

Get user's home timeline.

**Query Parameters:**
- `maxResults` (optional, default: 20): Number of tweets to retrieve

**Response:**
```json
{
  "success": true,
  "tweets": [
    {
      "id": "1234567890",
      "text": "Tweet content...",
      "author": {...},
      "created_at": "2025-11-10T12:00:00Z"
    }
  ],
  "count": 20
}
```

#### GET /api/social/twitter/search

Search user's tweets.

**Query Parameters:**
- `query` (optional): Search query
- `maxResults` (optional, default: 100): Number of tweets

**Response:**
```json
{
  "success": true,
  "tweets": [...],
  "count": 50,
  "query": "AI automation"
}
```

#### POST /api/social/twitter/engage

Engage with a tweet (like, retweet, or reply).

**Request:**
```json
{
  "tweetId": "1234567890",
  "type": "reply",  // "like", "retweet", or "reply"
  "replyContent": "Great insight!"  // Required if type is "reply"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully replyd tweet",
  "tweetId": "1234567890",
  "type": "reply"
}
```

#### POST /api/social/twitter/schedule

Schedule a tweet for later.

**Request:**
```json
{
  "content": "Scheduled tweet content",
  "scheduledAt": "2025-11-11T10:00:00Z",
  "replyToTweetId": "optional",
  "quoteTweetId": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "scheduleId": "schedule_id",
  "scheduledAt": "2025-11-11T10:00:00Z",
  "message": "Tweet scheduled successfully"
}
```

### Reddit Endpoints

#### POST /api/social/reddit/post

Post to a Reddit subreddit.

**Request:**
```json
{
  "subreddit": "webdev",
  "title": "Check out my new project",
  "content": "Built with Next.js and AI...",  // For text posts
  "url": "https://example.com",  // For link posts
  "flair": "optional_flair_id"
}
```

**Response:**
```json
{
  "success": true,
  "postId": "post_id",
  "url": "https://reddit.com/r/webdev/comments/...",
  "message": "Posted to Reddit successfully"
}
```

### Analysis Endpoints

#### POST /api/twitter/analyze

Analyze tweet characteristics using AI.

**Request:**
```json
{
  "content": "Tweet to analyze"
}
```

**Response:**
```json
{
  "sentiment": "positive",
  "topics": ["AI", "technology"],
  "hooks": ["Did you know that..."],
  "style": "informative and engaging",
  "voice": "professional yet approachable",
  "structure": "hook + value + call-to-action",
  "engagement_potential": 85
}
```

#### GET /api/twitter/patterns

Analyze user's historical tweet patterns.

**Response:**
```json
{
  "common_hooks": ["🚀", "Let's talk about..."],
  "typical_structure": "Thread format with numbered points",
  "voice_characteristics": "Direct, actionable, friendly",
  "engagement_patterns": {
    "best_time": "10:00 AM",
    "best_day": "Tuesday",
    "avg_engagement": 150
  },
  "content_themes": ["AI", "productivity", "automation"]
}
```

#### POST /api/twitter/generate

Generate a tweet in user's authentic style.

**Request:**
```json
{
  "topic": "AI automation",
  "context": "Focus on productivity benefits"
}
```

**Response:**
```json
{
  "content": "🚀 AI automation isn't about replacing humans—it's about amplifying what we do best.\n\nImagine spending zero time on repetitive tasks and more time on creative problem-solving.\n\nThat's the future we're building. Ready?"
}
```

### Autonomous Agent Endpoints

#### POST /api/agent/autonomous

Start the autonomous agent.

**Request:**
```json
{
  "platforms": ["twitter", "reddit"],
  "autoPostEnabled": true,
  "postingFrequency": "daily",
  "autoEngageEnabled": true,
  "engagementRules": {
    "autoLike": true,
    "autoRetweet": false,
    "autoReply": true,
    "minEngagementScore": 70
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Autonomous agent started",
  "agentId": "agent_id"
}
```

#### DELETE /api/agent/autonomous

Stop the autonomous agent.

**Response:**
```json
{
  "success": true,
  "message": "Autonomous agent stopped"
}
```

#### GET /api/agent/autonomous

Get agent status.

**Response:**
```json
{
  "isRunning": true,
  "platforms": ["twitter"],
  "lastActivity": "2025-11-10T12:30:00Z",
  "postsToday": 3,
  "engagementsToday": 15,
  "nextScheduledPost": "2025-11-10T18:00:00Z"
}
```

## Chat Agent Integration

### Enabling Social Media Commands

The chat agent can now execute social media actions. Here's how to integrate:

### 1. Add Social Media Tools to Agent

Update your agent's tool list to include social media capabilities:

```typescript
const socialMediaTools = [
  {
    name: 'post_tweet',
    description: 'Post a tweet to Twitter',
    parameters: {
      content: 'Tweet content (max 280 chars)',
      replyToTweetId: 'Optional: Tweet ID to reply to',
    }
  },
  {
    name: 'get_timeline',
    description: 'Get user\'s Twitter timeline',
    parameters: {
      maxResults: 'Number of tweets to fetch'
    }
  },
  {
    name: 'engage_tweet',
    description: 'Engage with a tweet (like, retweet, or reply)',
    parameters: {
      tweetId: 'Tweet ID',
      type: 'Engagement type: like, retweet, or reply',
      replyContent: 'Content for reply (if type is reply)'
    }
  },
  {
    name: 'schedule_tweet',
    description: 'Schedule a tweet for later',
    parameters: {
      content: 'Tweet content',
      scheduledAt: 'ISO 8601 datetime'
    }
  },
  {
    name: 'post_to_reddit',
    description: 'Post to a Reddit subreddit',
    parameters: {
      subreddit: 'Subreddit name',
      title: 'Post title',
      content: 'Post content (for text posts)',
      url: 'URL (for link posts)'
    }
  },
  {
    name: 'analyze_patterns',
    description: 'Analyze user\'s tweet patterns',
    parameters: {}
  },
  {
    name: 'generate_tweet',
    description: 'Generate a tweet in user\'s style',
    parameters: {
      topic: 'Topic to write about',
      context: 'Additional context'
    }
  }
];
```

### 2. Implement Tool Execution

```typescript
async function executeSocialMediaTool(toolName: string, parameters: any) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  switch (toolName) {
    case 'post_tweet':
      return await fetch(`${baseUrl}/api/social/twitter/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(r => r.json());
      
    case 'get_timeline':
      return await fetch(`${baseUrl}/api/social/twitter/timeline?maxResults=${parameters.maxResults || 20}`)
        .then(r => r.json());
      
    case 'engage_tweet':
      return await fetch(`${baseUrl}/api/social/twitter/engage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(r => r.json());
      
    case 'schedule_tweet':
      return await fetch(`${baseUrl}/api/social/twitter/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(r => r.json());
      
    case 'post_to_reddit':
      return await fetch(`${baseUrl}/api/social/reddit/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(r => r.json());
      
    case 'analyze_patterns':
      return await fetch(`${baseUrl}/api/twitter/patterns`)
        .then(r => r.json());
      
    case 'generate_tweet':
      return await fetch(`${baseUrl}/api/twitter/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters)
      }).then(r => r.json());
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

### 3. Example Chat Interactions

**User:** "Post a tweet saying 'Just launched my new AI project! 🚀'"

**Agent Response:**
```
I'll post that tweet for you right away!

*Calling post_tweet...*

✅ Tweet posted successfully!
Tweet ID: 1234567890
URL: https://twitter.com/user/status/1234567890
```

**User:** "What's trending on my timeline?"

**Agent Response:**
```
Let me check your timeline...

*Calling get_timeline...*

Here are the top tweets from your timeline:

1. @user1: "AI is transforming..."
   👍 150 ❤️ 45 💬 12

2. @user2: "New productivity hack..."
   👍 89 ❤️ 34 💬 8

3. @user3: "Just shipped v2.0..."
   👍 203 ❤️ 67 💬 23

Would you like to engage with any of these?
```

**User:** "Reply to the first tweet with 'Great insights!'"

**Agent Response:**
```
I'll reply to that tweet for you!

*Calling engage_tweet with type='reply'...*

✅ Reply posted successfully!
Your reply: "Great insights!"
```

## Autonomous Agent

### How It Works

The autonomous agent runs in the background and:

1. **Auto-Posting:** Posts content on a schedule (hourly, daily, twice daily, or custom)
2. **Auto-Engagement:** Monitors timeline and engages with relevant content
3. **Content Generation:** Uses AI to generate posts in your authentic style
4. **Analytics:** Tracks performance and optimizes posting times

### Starting the Agent

```typescript
// From code
import { AutonomousAgentManager } from '@/src/services/autonomousAgent';

await AutonomousAgentManager.startAgent(userId, {
  platforms: ['twitter'],
  autoPostEnabled: true,
  postingFrequency: 'daily',
  autoEngageEnabled: true,
  engagementRules: {
    autoLike: true,
    autoRetweet: false,
    autoReply: true,
    minEngagementScore: 70
  },
  contentTopics: ['AI', 'automation', 'productivity'],
  targetAudience: 'tech professionals'
});
```

```bash
# Via API
curl -X POST http://localhost:3000/api/agent/autonomous \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["twitter"],
    "autoPostEnabled": true,
    "postingFrequency": "daily",
    "autoEngageEnabled": true,
    "engagementRules": {
      "autoLike": true,
      "autoRetweet": false,
      "autoReply": true,
      "minEngagementScore": 70
    }
  }'
```

### Agent Configuration

Stored in `users.onboarding_data`:

```json
{
  "auto_post_enabled": true,
  "posting_frequency": "daily",
  "posting_times": ["09:00", "15:00"],
  "auto_engage_enabled": true,
  "auto_like": true,
  "auto_retweet": false,
  "auto_reply": true,
  "min_engagement_score": 70,
  "content_topics": ["AI", "automation", "productivity"],
  "target_audience": "tech professionals",
  "tweet_patterns": {
    "common_hooks": ["🚀", "Let's talk about..."],
    "voice_characteristics": "Direct and actionable",
    "content_themes": ["AI", "productivity"]
  }
}
```

## Testing Guide

### 1. Test OAuth Connection

1. Navigate to `/dashboard/connections`
2. Click "Connect Twitter"
3. Authorize on Composio OAuth page
4. Verify redirect back with success message
5. Check connection shows as "Connected" with Active badge

### 2. Test API Endpoints

```bash
# Post a tweet
curl -X POST http://localhost:3000/api/social/twitter/post \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"content": "Test tweet from Nexa"}'

# Get timeline
curl http://localhost:3000/api/social/twitter/timeline \
  -H "Cookie: your-session-cookie"

# Engage with tweet
curl -X POST http://localhost:3000/api/social/twitter/engage \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "tweetId": "1234567890",
    "type": "like"
  }'
```

### 3. Test Chat Integration

1. Go to `/chat`
2. Type: "Post a tweet saying 'Hello World!'"
3. Verify agent posts the tweet
4. Type: "Show me my timeline"
5. Verify agent fetches and displays timeline

### 4. Test Autonomous Agent

```bash
# Start agent
curl -X POST http://localhost:3000/api/agent/autonomous \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "platforms": ["twitter"],
    "autoPostEnabled": true,
    "postingFrequency": "hourly"
  }'

# Check status
curl http://localhost:3000/api/agent/autonomous \
  -H "Cookie: your-session-cookie"

# Stop agent
curl -X DELETE http://localhost:3000/api/agent/autonomous \
  -H "Cookie: your-session-cookie"
```

## Deployment

### Environment Variables

Required environment variables for production:

```bash
# Composio API
COMPOSIO_API_KEY=your_composio_api_key

# OpenAI (for AI analysis and generation)
OPENAI_API_KEY=your_openai_api_key

# App URL (for OAuth callbacks)
NEXTAUTH_URL=https://your-app.vercel.app

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Vercel Deployment

1. **Set Environment Variables** in Vercel Dashboard
2. **Deploy** - Push to main branch or deploy manually
3. **Test OAuth** - Ensure callback URL is whitelisted in Composio
4. **Monitor Logs** - Check Vercel function logs for any issues

### Database Setup

Ensure `composio_connections` table exists:

```sql
CREATE TABLE IF NOT EXISTS composio_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  composio_connection_id TEXT NOT NULL,
  toolkit_slug TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_composio_connections_user_id ON composio_connections(user_id);
CREATE INDEX idx_composio_connections_toolkit ON composio_connections(toolkit_slug);
```

## Troubleshooting

### OAuth Connection Fails

**Issue:** Connection shows as failed or doesn't redirect properly

**Solutions:**
1. Check COMPOSIO_API_KEY is set correctly
2. Verify callback URL is whitelisted in Composio dashboard
3. Check browser console for errors
4. Verify NEXTAUTH_URL is correct

### API Endpoints Return 401

**Issue:** Unauthorized error when calling API endpoints

**Solutions:**
1. Ensure user is logged in (check session)
2. Verify cookies are being sent with requests
3. Check authentication middleware is working

### Agent Won't Start

**Issue:** Autonomous agent fails to start

**Solutions:**
1. Verify user has connected at least one platform
2. Check agent configuration in database
3. Review server logs for error messages
4. Ensure worker process is running

### Tweets Not Posting

**Issue:** API call succeeds but tweet doesn't appear

**Solutions:**
1. Verify Composio connection is still active
2. Check Twitter API rate limits
3. Review Composio dashboard for error logs
4. Test connection by reconnecting account

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in Vercel
3. Check Composio dashboard for API issues
4. Contact support with detailed error messages

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0
