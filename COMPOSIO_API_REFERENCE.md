# Composio Integration API Reference

## Base URL
```
http://localhost:3000/api/composio
```

---

## Authentication

All endpoints require a valid NextAuth session (authenticated user).

**Headers Required**:
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

---

## Endpoints

### 1. Initiate OAuth Connection

**Endpoint**: `POST /api/composio/auth/[platform]`

**Parameters**:
- `platform` (path): `twitter` | `reddit` | `linkedin`

**Response**:
```json
{
  "success": true,
  "authUrl": "https://composio.dev/oauth/authorize?...",
  "connectionId": "conn_123abc",
  "platform": "twitter"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/composio/auth/twitter \
  -H "Content-Type: application/json"
```

**Usage**:
```typescript
// Initiate Twitter OAuth
const response = await fetch('/api/composio/auth/twitter', {
  method: 'POST',
});

const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect to OAuth
```

---

### 2. OAuth Callback Handler

**Endpoint**: `GET /api/composio/callback`

**Query Parameters**:
- `connectionId` (required): Connection ID from Composio
- `state` (required): State token for verification
- `error` (optional): Error code if auth failed
- `error_description` (optional): Error description

**Response** (Redirect):
```
Redirects to: /integrations?success=twitter%20connected%20successfully&platform=twitter
or
Redirects to: /integrations?error=Connection%20failed
```

**Example**:
```
http://localhost:3000/api/composio/callback?connectionId=abc123&state=xyz789
```

---

### 3. Create and Publish Post

**Endpoint**: `POST /api/composio/post`

**Request Body**:
```json
{
  "platforms": ["twitter", "reddit", "linkedin"],
  "content": "Your message here",
  "options": {
    "mediaUrls": ["https://example.com/image.jpg"],
    "scheduledTime": 1703001600000
  }
}
```

**Parameters**:
- `platforms` (required): Array of platform names
- `content` (required): String or object with platform-specific content
  ```json
  {
    "twitter": "Tweet content (280 chars)",
    "reddit": "Reddit post content",
    "linkedin": "Professional post content"
  }
  ```
- `options` (optional):
  - `mediaUrls`: Array of image/video URLs
  - `scheduledTime`: Unix timestamp for scheduling (omit for immediate post)

**Response**:
```json
{
  "success": true,
  "results": {
    "twitter": {
      "success": true,
      "postId": "1234567890",
      "url": "https://twitter.com/user/status/1234567890",
      "message": "Post published to twitter"
    },
    "reddit": {
      "success": true,
      "postId": "abc123def456",
      "url": "https://reddit.com/r/example/comments/abc123",
      "message": "Post published to reddit"
    },
    "linkedin": {
      "success": false,
      "error": "No active linkedin connection",
      "message": "Failed to post to linkedin"
    }
  },
  "postIds": ["1234567890", "abc123def456"],
  "count": 2
}
```

**Example**:
```typescript
const response = await fetch('/api/composio/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platforms: ['twitter'],
    content: 'Check out this amazing feature! 🚀',
  }),
});

const result = await response.json();
console.log('Posted:', result.postIds);
```

**Platform-Specific Content**:
```typescript
// If using object format for platform-specific content
const response = await fetch('/api/composio/post', {
  method: 'POST',
  body: JSON.stringify({
    platforms: ['twitter', 'reddit'],
    content: {
      twitter: 'Check out this! #AI',
      reddit: 'This is a longer discussion for Reddit',
    },
  }),
});
```

**Scheduling Example**:
```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

await fetch('/api/composio/post', {
  method: 'POST',
  body: JSON.stringify({
    platforms: ['twitter'],
    content: 'Scheduled tweet',
    options: {
      scheduledTime: tomorrow.getTime(),
    },
  }),
});
```

---

### 4. List Connected Accounts

**Endpoint**: `GET /api/composio/connections`

**Query Parameters**: None

**Response**:
```json
{
  "success": true,
  "connections": [
    {
      "id": "uuid-123",
      "platform": "twitter",
      "username": "@yourhandle",
      "status": "active",
      "connectedAt": "2025-12-20T10:30:00Z"
    },
    {
      "id": "uuid-456",
      "platform": "reddit",
      "username": "your_reddit_name",
      "status": "active",
      "connectedAt": "2025-12-20T11:15:00Z"
    }
  ],
  "count": 2
}
```

**Example**:
```typescript
const response = await fetch('/api/composio/connections');
const { connections } = await response.json();

connections.forEach(conn => {
  console.log(`${conn.platform}: @${conn.username}`);
});
```

---

### 5. Disconnect Account

**Endpoint**: `DELETE /api/composio/connections`

**Query Parameters**:
- `platform` (required): `twitter` | `reddit` | `linkedin`

**Response**:
```json
{
  "success": true,
  "message": "twitter connection removed"
}
```

**Error Response** (404):
```json
{
  "error": "No twitter connection found",
  "message": "Failed to remove connection"
}
```

**Example**:
```typescript
const response = await fetch(
  '/api/composio/connections?platform=twitter',
  { method: 'DELETE' }
);

const result = await response.json();
console.log(result.message);
```

---

## Growth Agent Actions

While not direct API endpoints, these can be called via the Growth Agent:

### Create Post
```typescript
import { GrowthAgent } from '@/lib/agents/growthAgent';

const agent = new GrowthAgent(userId);
const result = await agent.executeAction('create_post', {
  platform: 'twitter',
  content: 'Your tweet here',
  mediaUrls: [],
});
```

**Response**:
```json
{
  "success": true,
  "platform": "twitter",
  "postId": "1234567890",
  "url": "https://twitter.com/user/status/1234567890",
  "savedPostId": "uuid-123"
}
```

### Schedule Post
```typescript
const result = await agent.executeAction('schedule_post', {
  platform: 'twitter',
  content: 'Scheduled tweet',
  scheduledAt: new Date(Date.now() + 3600000).toISOString(),
});
```

### Analyze Performance
```typescript
const result = await agent.executeAction('analyze_performance', {
  postId: '1234567890',
  platform: 'twitter',
  period: '24h',
});
```

**Response**:
```json
{
  "success": true,
  "postId": "1234567890",
  "platform": "twitter",
  "analytics": {
    "likes": 145,
    "retweets": 23,
    "replies": 12,
    "views": 2340,
    "engagement_rate": 7.2
  }
}
```

### Engage with Post
```typescript
const result = await agent.executeAction('engage_with_post', {
  platform: 'twitter',
  postId: '1234567890',
  engagementType: 'like', // 'like' | 'retweet' | 'reply' | 'comment'
  content: 'Great post!' // For reply/comment
});
```

---

## Autonomous Growth Endpoint

### Execute Full Workflow

```typescript
import { executeAutonomousGrowth } from '@/lib/agents/autonomousGrowthAgent';

const result = await executeAutonomousGrowth({
  userId,
  userBrief: 'Post about AI breakthroughs',
  platforms: ['twitter', 'reddit', 'linkedin'],
  autoEngage: true,
  analyzeMetrics: true,
});
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully posted to 2 platforms",
  "postIds": ["1234567890", "abc123def456"],
  "urls": [
    "https://twitter.com/user/status/1234567890",
    "https://reddit.com/r/example/comments/abc123"
  ],
  "metrics": {
    "1234567890": {
      "likes": 23,
      "retweets": 5,
      "replies": 2,
      "views": 340,
      "engagement_rate": 8.8
    }
  },
  "executionLog": [
    "🚀 Autonomous Growth Agent Started",
    "📝 Brief: Post about AI breakthroughs",
    "📱 Platforms: twitter, reddit",
    "🔗 Checking platform connections...",
    "✅ Verified connections: twitter, reddit",
    "📝 Generating content with Mistral AI...",
    "✅ Content generated successfully",
    "📤 Publishing to platforms...",
    "✅ Posted to twitter: https://...",
    "✅ Posted to reddit: https://...",
    "📊 Fetching post performance metrics...",
    "💳 Credits used: ~10",
    "✨ Autonomous Growth Complete!"
  ],
  "estimatedCreditsUsed": 10
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "error": "At least one platform is required"
}
```

### 404 Not Found
```json
{
  "error": "No active connection",
  "message": "No twitter connection found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create post",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

| Platform | Limit | Window |
|----------|-------|--------|
| Twitter | 300 requests | 15 minutes |
| Reddit | 60 requests | 1 minute |
| LinkedIn | 100 requests | 1 hour |

---

## Content Constraints

| Platform | Constraint |
|----------|-----------|
| Twitter | 280 characters |
| Reddit | Title (300 chars) + Body (unlimited) |
| LinkedIn | Unlimited (recommended <1300 chars) |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Examples

### Complete Workflow Example

```typescript
// 1. Connect Twitter
const authResponse = await fetch('/api/composio/auth/twitter', {
  method: 'POST',
});
const { authUrl } = await authResponse.json();
// User is redirected to authUrl and authorizes

// 2. Verify connection
const connectionsResponse = await fetch('/api/composio/connections');
const { connections } = await connectionsResponse.json();
console.log('Connected:', connections.map(c => c.platform));

// 3. Post content
const postResponse = await fetch('/api/composio/post', {
  method: 'POST',
  body: JSON.stringify({
    platforms: ['twitter'],
    content: 'Hello from Composio!',
  }),
});
const { postIds, results } = await postResponse.json();

// 4. Analyze performance
const agent = new GrowthAgent(userId);
const metrics = await agent.executeAction('analyze_performance', {
  postId: postIds[0],
  platform: 'twitter',
});

console.log('Engagement:', metrics.analytics.engagement_rate + '%');
```

---

## Testing with cURL

```bash
# Connect account
curl -X POST http://localhost:3000/api/composio/auth/twitter

# List connections
curl http://localhost:3000/api/composio/connections

# Create post
curl -X POST http://localhost:3000/api/composio/post \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["twitter"],
    "content": "Hello world!"
  }'

# Disconnect
curl -X DELETE http://localhost:3000/api/composio/connections?platform=twitter
```

---

## SDKs & Libraries

- **Composio**: `npm install @composio/core`
- **Mistral**: `npm install @mistralai/mistralai`
- **Supabase**: `npm install @supabase/supabase-js`

---

## Version
- **API Version**: 1.0.0
- **Last Updated**: 2025-12-20
- **Status**: Production Ready

---

For more examples, see `COMPOSIO_USAGE_EXAMPLES.md`
