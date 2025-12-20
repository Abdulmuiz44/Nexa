# Composio + Mistral AI Usage Examples

## Quick Start

### 1. Install Dependencies
```bash
npm install @composio/core @mistralai/mistralai
```

### 2. Setup Environment
```env
COMPOSIO_API_KEY=your_api_key
MISTRAL_API_KEY=your_mistral_key
NEXTAUTH_URL=http://localhost:3000
```

---

## Frontend Usage Examples

### Connect Social Media Account

```typescript
// Hook to initiate OAuth
async function connectPlatform(platform: 'twitter' | 'reddit' | 'linkedin') {
  const response = await fetch(`/api/composio/auth/${platform}`, {
    method: 'POST',
  });

  const { authUrl } = await response.json();

  // Redirect to OAuth
  window.location.href = authUrl;
}

// Usage
<button onClick={() => connectPlatform('twitter')}>
  Connect Twitter
</button>
```

### Create and Publish Post

```typescript
async function publishPost(platforms: string[], content: string) {
  const response = await fetch('/api/composio/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platforms,
      content, // String or object with platform-specific content
      options: {
        mediaUrls: [], // Optional media
        scheduledTime: undefined, // Optional scheduled time
      },
    }),
  });

  const result = await response.json();
  console.log('Posted to:', result.results);
  return result;
}

// Usage
publishPost(['twitter', 'reddit'], 'Check out this amazing AI feature!');
```

### Schedule Post for Later

```typescript
async function schedulePost(
  platforms: string[],
  content: string,
  scheduleTime: Date
) {
  const response = await fetch('/api/composio/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platforms,
      content,
      options: {
        scheduledTime: scheduleTime.getTime(),
      },
    }),
  });

  return response.json();
}

// Schedule for tomorrow at 10 AM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

await schedulePost(['twitter'], 'Scheduled tweet', tomorrow);
```

### Get Connected Accounts

```typescript
async function getConnections() {
  const response = await fetch('/api/composio/connections', {
    method: 'GET',
  });

  const { connections } = await response.json();
  console.log('Connected accounts:', connections);
  return connections;
}

// Usage
const accounts = await getConnections();
accounts.forEach(conn => {
  console.log(`${conn.platform}: @${conn.username}`);
});
```

### Disconnect Account

```typescript
async function disconnectPlatform(platform: string) {
  const response = await fetch(
    `/api/composio/connections?platform=${platform}`,
    { method: 'DELETE' }
  );

  return response.json();
}

// Usage
await disconnectPlatform('twitter');
```

---

## Backend Usage Examples

### Growth Agent - Post Creation

```typescript
import { GrowthAgent } from '@/lib/agents/growthAgent';

// Create agent instance
const agent = new GrowthAgent(userId);

// Post a tweet
const result = await agent.executeAction('create_post', {
  platform: 'twitter',
  content: 'Hello, world! This is from Composio + Mistral',
});

console.log('Posted:', result.postId, result.url);
```

### Growth Agent - Schedule Post

```typescript
const agent = new GrowthAgent(userId);

const scheduledResult = await agent.executeAction('schedule_post', {
  platform: 'reddit',
  content: 'Check out this discussion thread!',
  scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
});

console.log('Scheduled:', scheduledResult.postId);
```

### Growth Agent - Get Analytics

```typescript
const agent = new GrowthAgent(userId);

const metrics = await agent.executeAction('analyze_performance', {
  postId: 'tweet_id_123',
  platform: 'twitter',
  period: '24h',
});

console.log('Engagement:', metrics.analytics);
// Output: { likes: 145, retweets: 23, replies: 12, views: 2340, engagement_rate: 7.2 }
```

### Growth Agent - Engage with Post

```typescript
const agent = new GrowthAgent(userId);

// Like a tweet
await agent.executeAction('engage_with_post', {
  platform: 'twitter',
  postId: 'tweet_id_123',
  engagementType: 'like',
});

// Reply to a tweet
await agent.executeAction('engage_with_post', {
  platform: 'twitter',
  postId: 'tweet_id_123',
  engagementType: 'reply',
  content: 'Great post! Thanks for sharing.',
});

// Comment on Reddit
await agent.executeAction('engage_with_post', {
  platform: 'reddit',
  postId: 'post_id_456',
  engagementType: 'comment',
  content: 'This is a great discussion point!',
});
```

### Autonomous Growth Agent

```typescript
import { executeAutonomousGrowth, streamAutonomousGrowth } from '@/lib/agents/autonomousGrowthAgent';

// Execute full autonomous workflow
const result = await executeAutonomousGrowth({
  userId,
  userBrief: 'AI breakthroughs this week in machine learning',
  platforms: ['twitter', 'reddit', 'linkedin'],
  autoEngage: true,
  analyzeMetrics: true,
});

console.log('Posted to:', result.postIds.length, 'platforms');
console.log('URLs:', result.urls);
console.log('Execution Log:', result.executionLog);
```

### Stream Autonomous Growth with Real-time Updates

```typescript
// Stream updates as they happen
for await (const update of streamAutonomousGrowth({
  userId,
  userBrief: 'AI breakthroughs',
  platforms: ['twitter'],
})) {
  console.log('Progress:', update.executionLog);
  if (update.success) {
    console.log('Posted:', update.postIds);
  }
}
```

---

## Mistral AI Content Generation

### Generate Platform-Specific Content

```typescript
import { ContentAgent } from '@/lib/agents/contentAgent';

const contentAgent = new ContentAgent(userId);

const content = await contentAgent.generateContent({
  userId,
  brief: 'Announcing new AI features in our platform',
  toolkits: ['twitter', 'reddit', 'linkedin'],
  tone: 'professional',
});

console.log('Twitter:', content.twitter);
console.log('Reddit:', content.reddit);
console.log('LinkedIn:', content.linkedin);
```

### Generate Content in User's Style

```typescript
import { ComposioIntegrationService } from '@/src/services/composioIntegration';

const composio = new ComposioIntegrationService(userId);

// Analyze user's Twitter patterns
const patterns = await composio.analyzeUserTweetPatterns();

// Generate tweet matching user's style
const tweet = await composio.generateTweetInUserStyle(
  'AI and machine learning',
  'Include recent research findings'
);

console.log('Generated tweet:', tweet);
```

---

## Twitter Toolkit Examples

```typescript
import * as TwitterToolkit from '@/lib/composio/twitter';

// Post a tweet
const postResult = await TwitterToolkit.postTweet(
  userId,
  'Just launched Nexa AI! 🚀'
);

// Like a tweet
await TwitterToolkit.likeTweet(userId, 'tweet_id');

// Retweet
await TwitterToolkit.retweet(userId, 'tweet_id');

// Reply to a tweet
await TwitterToolkit.replyToTweet(
  userId,
  'tweet_id',
  'Great point! Here's my take...'
);

// Get user's timeline
const timeline = await TwitterToolkit.getUserTimeline(userId, 20);

// Search tweets
const tweets = await TwitterToolkit.searchTweets(
  userId,
  'AI automation',
  50
);

// Get tweet analytics
const analytics = await TwitterToolkit.getTweetAnalytics(userId, 'tweet_id');
```

---

## Reddit Toolkit Examples

```typescript
import * as RedditToolkit from '@/lib/composio/reddit';

// Post text to subreddit
const postResult = await RedditToolkit.postTextToReddit(
  userId,
  'r/ArtificialIntelligence',
  'New AI Automation Tool Released',
  'Check out this new tool for automating content creation...'
);

// Post link
await RedditToolkit.postLinkToReddit(
  userId,
  'r/tech',
  'AI Breakthroughs This Week',
  'https://example.com/ai-news'
);

// Comment on post
await RedditToolkit.postCommentToReddit(
  userId,
  'post_id',
  'This is a great discussion point!'
);

// Get user's posts
const posts = await RedditToolkit.getUserPosts(userId, 50);

// Search subreddit
const subreddits = await RedditToolkit.searchSubreddit(
  userId,
  'AI automation',
  20
);

// Get subreddit posts
const redditPosts = await RedditToolkit.getSubredditPosts(
  userId,
  'r/ArtificialIntelligence',
  50
);

// Get post analytics
const postMetrics = await RedditToolkit.getPostAnalytics(userId, 'post_id');
```

---

## LinkedIn Toolkit Examples

```typescript
import * as LinkedInToolkit from '@/lib/composio/linkedin';

// Post to LinkedIn
const postResult = await LinkedInToolkit.postToLinkedIn(
  userId,
  'Excited to announce our new AI platform! 🚀'
);

// Comment on post
await LinkedInToolkit.commentOnLinkedInPost(
  userId,
  'post_id',
  'Great insights! Thanks for sharing.'
);

// Like a post
await LinkedInToolkit.likeLinkedInPost(userId, 'post_id');

// Get user profile
const profile = await LinkedInToolkit.getUserProfile(userId);

// Get user's posts
const posts = await LinkedInToolkit.getUserPosts(userId, 50);

// Search users
const users = await LinkedInToolkit.searchUsers(userId, 'AI entrepreneurs', 20);

// Get post analytics
const metrics = await LinkedInToolkit.getPostAnalytics(userId, 'post_id');

// Get connections
const connections = await LinkedInToolkit.getConnections(userId, 100);
```

---

## Chat Interface Integration

### Via Agent Chat

```typescript
// User sends message in chat
const userMessage = 'Post about our new AI features on Twitter and Reddit';

// Agent processes and executes
const result = await executeAutonomousGrowth({
  userId: session.user.id,
  userBrief: userMessage,
  platforms: ['twitter', 'reddit'],
  analyzeMetrics: true,
});

// Return result to user
console.log('Posted successfully!');
console.log('URLs:', result.urls);
```

### Stream Updates to UI

```typescript
// Server-sent events approach
export async function* chatWithAgent(userId: string, message: string) {
  for await (const update of streamAutonomousGrowth({
    userId,
    userBrief: message,
    platforms: ['twitter'],
  })) {
    yield {
      type: 'progress',
      data: update.executionLog,
    };
  }
}
```

---

## Error Handling

```typescript
try {
  const result = await agent.executeAction('create_post', {
    platform: 'twitter',
    content: 'Post content',
  });

  if (!result.success) {
    console.error('Post failed:', result.error);
  }
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('No active connection')) {
      console.error('User needs to connect their account');
    } else {
      console.error('Posting failed:', error.message);
    }
  }
}
```

---

## Rate Limiting & Best Practices

### Respect Platform Limits
```typescript
// Twitter: 300 requests/15 min (user context)
// Reddit: 60 requests/min
// LinkedIn: 100 requests/hour

// Implement queue for high volume
const postQueue: PostRequest[] = [];

async function queuePost(request: PostRequest) {
  postQueue.push(request);
  if (postQueue.length === 1) {
    processQueue();
  }
}

async function processQueue() {
  while (postQueue.length > 0) {
    const request = postQueue.shift();
    await executePost(request);
    await delay(1000); // Rate limiting
  }
}
```

### Deduplication
```typescript
// Check if post already exists
const { data: existing } = await supabaseServer
  .from('posts')
  .select('id')
  .eq('user_id', userId)
  .eq('content', content)
  .eq('platform', platform)
  .limit(1)
  .single();

if (existing) {
  console.log('Post already exists');
  return existing;
}
```

---

## Monitoring & Logging

```typescript
import { createLogger } from '@/lib/logger';

const logger = createLogger();

async function monitoredPost(userId: string, content: string) {
  const startTime = Date.now();

  try {
    const result = await postTweet(userId, content);
    const duration = Date.now() - startTime;

    await logger.info('post_success', 'Tweet posted', {
      userId,
      duration,
      postId: result.postId,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logger.error('post_failed', 'Failed to post tweet', {
      userId,
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

---

## Next Steps

1. Implement frontend components
2. Add analytics dashboard
3. Set up credit system
4. Configure webhooks for real-time updates
5. Implement auto-engagement features
6. Add multi-language support

For more details, see `COMPOSIO_MISTRAL_INTEGRATION.md`
