# Composio + Mistral AI - Quick Start Guide

**Last Updated**: December 20, 2025  
**Status**: Ready to Deploy

---

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)
```bash
npm install @composio/core @mistralai/mistralai
```

### Step 2: Set Environment Variables (1 min)
Create or update `.env.local`:
```env
# Get from composio.dev
COMPOSIO_API_KEY=your_composio_api_key

# Optional: If using specific auth config
COMPOSIO_AUTH_CONFIG_ID=your_auth_config_id

# Get from console.mistral.ai
MISTRAL_API_KEY=your_mistral_api_key

# Your app URL
NEXTAUTH_URL=http://localhost:3000
```

### Step 3: Run Database Migration (1 min)
```bash
# Using Supabase CLI
supabase db push

# Or manually run:
# supabase/migrations/20251110_social_media_integration.sql
```

### Step 4: Start Your App (2 min)
```bash
npm run dev
```

✅ **Done!** Your integration is ready.

---

## 🧪 Test the Integration

### 1. Connect a Social Account
```bash
# Open browser
curl -X POST http://localhost:3000/api/composio/auth/twitter

# Or visit in UI to trigger OAuth
```

### 2. Post Content
```typescript
// In your code
const response = await fetch('/api/composio/post', {
  method: 'POST',
  body: JSON.stringify({
    platforms: ['twitter'],
    content: 'Hello from Composio! 🚀',
  }),
});

const result = await response.json();
console.log('Posted:', result.postIds);
```

### 3. Check Your Post
Visit Twitter and confirm the post appeared!

---

## 📁 What Was Implemented

### Core Files (Ready to Use)
```
✅ lib/composio/
   ├── index.ts          - Client initialization
   ├── twitter.ts        - Twitter toolkit (8 functions)
   ├── reddit.ts         - Reddit toolkit (7 functions)
   └── linkedin.ts       - LinkedIn toolkit (8 functions)

✅ app/api/composio/
   ├── auth/             - OAuth initiation
   ├── callback/         - OAuth callback handler
   ├── post/             - Create/publish posts
   └── connections/      - Manage connections

✅ lib/agents/
   ├── growthAgent.ts    - Growth agent (updated)
   └── autonomousGrowthAgent.ts - Autonomous agent (new)

✅ types/composio.ts     - Type definitions
```

### Documentation (5 Guides)
1. **COMPOSIO_MISTRAL_INTEGRATION.md** - Architecture
2. **COMPOSIO_IMPLEMENTATION_CHECKLIST.md** - Setup steps
3. **COMPOSIO_USAGE_EXAMPLES.md** - Code examples
4. **COMPOSIO_API_REFERENCE.md** - API docs
5. **COMPOSIO_IMPLEMENTATION_SUMMARY.md** - Overview

---

## 💡 Common Use Cases

### Use Case 1: Post to Twitter
```typescript
await fetch('/api/composio/post', {
  method: 'POST',
  body: JSON.stringify({
    platforms: ['twitter'],
    content: 'Your tweet here',
  }),
});
```

### Use Case 2: Post to Multiple Platforms
```typescript
await fetch('/api/composio/post', {
  method: 'POST',
  body: JSON.stringify({
    platforms: ['twitter', 'reddit', 'linkedin'],
    content: {
      twitter: 'Tweet version',
      reddit: 'Reddit version',
      linkedin: 'LinkedIn version',
    },
  }),
});
```

### Use Case 3: Schedule a Post
```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

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

### Use Case 4: Autonomous Agent (Full Workflow)
```typescript
import { executeAutonomousGrowth } from '@/lib/agents/autonomousGrowthAgent';

const result = await executeAutonomousGrowth({
  userId: session.user.id,
  userBrief: 'Post about our new feature',
  platforms: ['twitter', 'reddit'],
  autoEngage: true,
  analyzeMetrics: true,
});

console.log('Posted:', result.postIds);
console.log('Metrics:', result.metrics);
```

### Use Case 5: With Chat Integration
```typescript
// User types in chat
const userMessage = 'Post about AI breakthroughs on Twitter and Reddit';

// Agent processes it
const result = await executeAutonomousGrowth({
  userId,
  userBrief: userMessage,
  platforms: ['twitter', 'reddit'],
});
```

---

## 🔗 OAuth Flow Explained

```
1. User clicks "Connect Twitter"
   ↓
2. Frontend calls POST /api/composio/auth/twitter
   ↓
3. Backend initiates OAuth with Composio
   ↓
4. User redirected to Twitter login
   ↓
5. User authorizes app
   ↓
6. Twitter redirects to Composio callback
   ↓
7. Composio redirects to GET /api/composio/callback
   ↓
8. Backend stores connection in database
   ↓
9. User redirected to integrations page
   ✅ Connected!
```

---

## 📊 API Endpoints (5 Total)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/composio/auth/[platform]` | POST | Start OAuth |
| `/api/composio/callback` | GET | Handle OAuth callback |
| `/api/composio/post` | POST | Post content |
| `/api/composio/connections` | GET | List connections |
| `/api/composio/connections` | DELETE | Disconnect |

---

## 🛠️ Toolkit Functions

### Twitter (8 functions)
```typescript
import * as Twitter from '@/lib/composio/twitter';

Twitter.postTweet(userId, 'content');
Twitter.likeTweet(userId, tweetId);
Twitter.retweet(userId, tweetId);
Twitter.replyToTweet(userId, tweetId, content);
Twitter.getUserTimeline(userId);
Twitter.getUserTweets(userId);
Twitter.searchTweets(userId, query);
Twitter.getTweetAnalytics(userId, tweetId);
```

### Reddit (7 functions)
```typescript
import * as Reddit from '@/lib/composio/reddit';

Reddit.postTextToReddit(userId, subreddit, title, content);
Reddit.postLinkToReddit(userId, subreddit, title, url);
Reddit.postCommentToReddit(userId, postId, content);
Reddit.getUserPosts(userId);
Reddit.searchSubreddit(userId, query);
Reddit.getSubredditPosts(userId, subreddit);
Reddit.getPostAnalytics(userId, postId);
```

### LinkedIn (8 functions)
```typescript
import * as LinkedIn from '@/lib/composio/linkedin';

LinkedIn.postToLinkedIn(userId, content);
LinkedIn.commentOnLinkedInPost(userId, postId, content);
LinkedIn.likeLinkedInPost(userId, postId);
LinkedIn.getUserProfile(userId);
LinkedIn.getUserPosts(userId);
LinkedIn.searchUsers(userId, query);
LinkedIn.getConnections(userId);
LinkedIn.getPostAnalytics(userId, postId);
```

---

## 🚨 Troubleshooting

### "Composio not initialized"
→ Check COMPOSIO_API_KEY is set in .env.local

### "No active connection"
→ User needs to connect account via OAuth first

### "Failed to post"
→ Check platform requirements (e.g., Reddit needs subreddit)

### "Unauthorized" error
→ Verify user is logged in (NextAuth session)

---

## 📈 Performance Tips

1. **Post to multiple platforms in parallel** (already implemented)
2. **Schedule posts instead of posting immediately** (supported)
3. **Batch analytics requests** (recommended)
4. **Cache user patterns** (ContentAgent does this)
5. **Implement rate limiting** (see docs)

---

## 🔐 Security Checklist

- [x] OAuth tokens handled by Composio
- [x] API key in environment only
- [x] User sessions validated
- [x] RLS policies on database
- [x] Error messages sanitized
- [x] State validation on callbacks

---

## 📚 Documentation Map

```
Start Here:
├── COMPOSIO_QUICK_START.md (this file)
│
Then Choose:
├─ COMPOSIO_MISTRAL_INTEGRATION.md (understand architecture)
├─ COMPOSIO_USAGE_EXAMPLES.md (code examples)
├─ COMPOSIO_API_REFERENCE.md (API details)
└─ COMPOSIO_IMPLEMENTATION_CHECKLIST.md (detailed setup)
```

---

## 💻 Example: Complete Post Workflow

```typescript
// 1. Connect account (one time)
const authRes = await fetch('/api/composio/auth/twitter');
const { authUrl } = await authRes.json();
window.location.href = authUrl;

// 2. Generate content with Mistral
const contentAgent = new ContentAgent(userId);
const content = await contentAgent.generateContent({
  userId,
  brief: 'AI news this week',
  toolkits: ['twitter'],
  tone: 'professional',
});

// 3. Post content
const postRes = await fetch('/api/composio/post', {
  method: 'POST',
  body: JSON.stringify({
    platforms: ['twitter'],
    content: content.twitter,
  }),
});

const { postIds } = await postRes.json();

// 4. Get analytics
const agent = new GrowthAgent(userId);
const metrics = await agent.executeAction('analyze_performance', {
  postId: postIds[0],
  platform: 'twitter',
});

console.log('Engagement rate:', metrics.analytics.engagement_rate + '%');
```

---

## ✅ What's Ready

- ✅ OAuth for 3 platforms (Twitter, Reddit, LinkedIn)
- ✅ 23 toolkit functions
- ✅ 5 API endpoints
- ✅ Mistral AI integration
- ✅ Autonomous agent
- ✅ Streaming updates
- ✅ Error handling
- ✅ Database schema
- ✅ Type definitions
- ✅ Comprehensive docs

---

## 🚀 Next: Frontend Components

To complete the UI, create these components:

```typescript
// components/SocialConnect.tsx
// Connect button for each platform

// components/PostComposer.tsx
// Compose and publish posts

// components/PostScheduler.tsx
// Schedule posts for later

// components/SocialConnections.tsx
// Manage connected accounts

// components/AnalyticsDashboard.tsx
// View post metrics
```

---

## 📞 Getting Help

1. **API Issues**: Check `COMPOSIO_API_REFERENCE.md`
2. **Setup Problems**: Check `COMPOSIO_IMPLEMENTATION_CHECKLIST.md`
3. **Code Examples**: Check `COMPOSIO_USAGE_EXAMPLES.md`
4. **Architecture**: Check `COMPOSIO_MISTRAL_INTEGRATION.md`
5. **Composio Docs**: https://docs.composio.dev/
6. **Mistral Docs**: https://docs.mistral.ai/

---

## 🎉 You're Ready!

The integration is complete and production-ready. Start by:

1. Setting environment variables
2. Running database migration
3. Testing OAuth flow
4. Creating a test post
5. Implementing frontend components

---

**Questions?** Refer to the comprehensive documentation in the repo.

**Ready to deploy?** All code is production-ready.

Good luck! 🚀
