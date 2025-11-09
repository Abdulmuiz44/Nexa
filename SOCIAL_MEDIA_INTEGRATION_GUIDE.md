# Nexa Social Media Integration - User Guide

## Overview

Nexa now includes comprehensive integration with X (Twitter) and Reddit through Composio, featuring an autonomous AI agent that can:

- **Authenticate** - Securely connect your X and Reddit accounts via OAuth
- **Analyze** - Understand your tweet patterns, style, voice, and engagement
- **Generate** - Create content that matches your authentic voice
- **Post** - Automatically publish tweets and Reddit posts
- **Engage** - Autonomously like, retweet, reply, and interact with relevant content
- **Schedule** - Plan posts for optimal engagement times
- **Monitor** - Track performance and analytics

## Features

### 1. X (Twitter) Integration

#### Authentication
```
POST /api/composio/start-auth?toolkit=twitter
```

Connect your X account through a secure OAuth flow powered by Composio.

#### Tweet Analysis
```
POST /api/twitter/analyze
Body: { "tweetContent": "Your tweet text here" }
```

Analyzes any tweet to extract:
- Sentiment (positive/negative/neutral)
- Topics and themes
- Hook phrases and patterns
- Writing style characteristics
- Voice and tone
- Structure (thread, single, with media)
- Engagement potential (0-100 score)

#### Pattern Detection
```
GET /api/twitter/patterns
```

Analyzes your historical tweets (up to 100 recent) to identify:
- Common hooks and openings
- Typical tweet structure
- Voice characteristics
- Best posting times and days
- Average engagement rates
- Content themes

The patterns are saved to your user profile for future use.

#### Content Generation
```
POST /api/twitter/generate
Body: { 
  "topic": "AI automation",
  "context": "Focus on productivity benefits"
}
```

Generates a tweet in YOUR authentic style based on:
- Your analyzed patterns
- Your typical voice and tone
- Your common hooks
- Your content themes

#### Tweet Posting
The service supports:
- Regular tweets
- Reply tweets (to specific tweet IDs)
- Quote tweets
- Tweets with media
- Scheduled tweets

#### Auto-Engagement
Automatically:
- Like relevant tweets
- Retweet important content
- Reply to conversations
- All based on AI-powered relevance scoring

### 2. Reddit Integration

#### Authentication
```
POST /api/composio/start-auth?toolkit=reddit
```

#### Posting
Supports:
- Text posts
- Link posts
- Scheduled posts
- Flair tags
- Multi-subreddit targeting

### 3. Autonomous Agent

The autonomous agent runs in the background and handles all social media activities automatically.

#### Start Agent
```
POST /api/agent/autonomous
```

Starts the autonomous agent with your configured preferences.

#### Stop Agent
```
DELETE /api/agent/autonomous
```

Stops the autonomous agent.

#### Check Status
```
GET /api/agent/autonomous
```

Returns the current agent status (active/stopped).

#### Configuration

The agent is configured through your user's `onboarding_data`:

```json
{
  "auto_post_enabled": true,
  "auto_engage_enabled": true,
  "posting_frequency": "daily",
  "custom_schedule": ["09:00", "15:00", "21:00"],
  "auto_like": true,
  "auto_retweet": false,
  "auto_reply": true,
  "min_engagement_score": 70,
  "content_topics": ["AI", "automation", "productivity"],
  "target_audience": "tech professionals and entrepreneurs"
}
```

#### Agent Behavior

**Posting Loop:**
- Checks schedule (hourly, daily, twice daily, or custom)
- Generates content in your style
- Posts to Twitter or Reddit
- Logs all activities

**Engagement Loop:**
- Monitors relevant content every 10 minutes
- Analyzes tweets for relevance (0-100 score)
- Auto-engages based on your rules
- Only engages with content scoring above `min_engagement_score`

## Architecture

### Core Services

#### ComposioIntegrationService
Located: `/src/services/composioIntegration.ts`

Main integration layer with Composio API. Handles:
- OAuth flows
- Tweet posting and searching
- Reddit posting
- Analytics retrieval
- Pattern analysis
- Content generation

Key methods:
- `initiateTwitterConnection()`
- `postTweet(tweetData)`
- `searchUserTweets(query, maxResults)`
- `analyzeTweet(tweetContent)`
- `analyzeUserTweetPatterns()`
- `generateTweetInUserStyle(topic, context)`
- `autoEngageWithTweet(tweetId, type, content)`
- `postToReddit(postData)`
- `schedulePost(platform, content, scheduledAt)`

#### AutonomousAgent
Located: `/src/services/autonomousAgent.ts`

Autonomous background agent. Features:
- Dual-loop architecture (posting + engagement)
- Intelligent scheduling
- AI-powered content generation
- Smart engagement decisions
- Activity logging
- Configurable rules

#### AutonomousAgentManager
Singleton manager for multi-user agent coordination:
- `createAgent(userId)` - Initialize agent for user
- `startAgent(userId)` - Start autonomous operations
- `stopAgent(userId)` - Stop and cleanup
- `getAgent(userId)` - Get running agent instance

## Database Schema

### New/Enhanced Tables

#### users.onboarding_data
Enhanced to store:
```json
{
  "tweet_patterns": {
    "common_hooks": ["How to", "Here's why", "Thread:"],
    "typical_structure": "Hook + explanation + CTA",
    "voice_characteristics": "Casual, helpful, enthusiastic",
    "engagement_patterns": {
      "best_time": "09:00",
      "best_day": "Tuesday",
      "avg_engagement": 3.5
    },
    "content_themes": ["AI", "productivity", "tools"]
  },
  "patterns_analyzed_at": "2025-01-01T00:00:00Z"
}
```

#### posts
Enhanced metadata:
```json
{
  "generated_by": "autonomous_agent",
  "url": "https://twitter.com/i/web/status/123",
  "engagement_score": 85,
  "analysis": {...}
}
```

#### activity_log
Tracks all agent actions:
- `agent_started`
- `agent_stopped`
- `auto_tweet_posted`
- `auto_reddit_post`
- `auto_like`
- `auto_retweet`
- `auto_reply`
- `post_generation_failed`

## API Endpoints Summary

### Composio Authentication
- `GET /api/composio/start-auth?toolkit=twitter` - Start OAuth
- `GET /api/composio/start-auth?toolkit=reddit` - Start OAuth
- `GET /api/composio/callback` - OAuth callback
- `GET /api/composio/connections` - List connections
- `DELETE /api/composio/disconnect` - Disconnect account

### Twitter Operations
- `POST /api/twitter/analyze` - Analyze tweet
- `GET /api/twitter/patterns` - Get user patterns
- `POST /api/twitter/generate` - Generate tweet

### Autonomous Agent
- `POST /api/agent/autonomous` - Start agent
- `DELETE /api/agent/autonomous` - Stop agent
- `GET /api/agent/autonomous` - Get status

## Usage Examples

### Example 1: Connect Twitter and Analyze Patterns

```javascript
// 1. Connect Twitter account
const authResponse = await fetch('/api/composio/start-auth?toolkit=twitter');
// User completes OAuth flow...

// 2. Analyze your tweet patterns
const patternsResponse = await fetch('/api/twitter/patterns');
const { patterns } = await patternsResponse.json();

console.log('Your voice:', patterns.voice_characteristics);
console.log('Common hooks:', patterns.common_hooks);
console.log('Best time to post:', patterns.engagement_patterns.best_time);
```

### Example 2: Generate and Post Tweet

```javascript
// Generate tweet in your style
const generateResponse = await fetch('/api/twitter/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'AI automation',
    context: 'Benefits for small businesses'
  })
});

const { content } = await generateResponse.json();
console.log('Generated tweet:', content);

// Post it (this would be done through the composio service)
```

### Example 3: Start Autonomous Agent

```javascript
// Start the agent
const startResponse = await fetch('/api/agent/autonomous', {
  method: 'POST'
});

const { success, message } = await startResponse.json();
console.log(message); // "Autonomous agent started successfully"

// Check status
const statusResponse = await fetch('/api/agent/autonomous');
const { isRunning, status } = await statusResponse.json();
console.log('Agent is', status); // "active"
```

## Configuration Best Practices

### 1. Posting Frequency
- **Hourly**: For very active accounts, high-value content
- **Daily**: Most common, maintains consistent presence
- **Twice Daily**: Morning and evening posts
- **Custom**: Specific times optimized for your audience

### 2. Engagement Rules
- Set `min_engagement_score` to 60-70 for broad engagement
- Set to 80+ for highly selective engagement
- Enable `auto_like` for maximum reach
- Be selective with `auto_retweet` to maintain brand voice
- Use `auto_reply` for community building

### 3. Content Topics
Be specific with topics to maintain relevance:
```json
[
  "AI automation tools",
  "productivity hacks",
  "remote work tips",
  "tech for startups"
]
```

### 4. Target Audience
Define clearly:
```
"SaaS founders and tech entrepreneurs aged 25-45 interested in AI and automation"
```

## Security & Privacy

1. **OAuth Security**: All connections use secure OAuth 2.0 flows
2. **Token Storage**: Access tokens encrypted in database
3. **Rate Limiting**: Built-in to prevent API abuse
4. **User Control**: Users can stop agent anytime
5. **Transparency**: All actions logged to activity_log

## Troubleshooting

### Agent Not Posting
1. Check connections: `GET /api/composio/connections`
2. Verify agent is running: `GET /api/agent/autonomous`
3. Check activity logs in database
4. Ensure posting schedule is configured

### Low Engagement Scores
1. Lower `min_engagement_score` threshold
2. Broaden `content_topics`
3. Adjust `target_audience` definition

### Pattern Analysis Fails
1. Ensure Twitter connection is active
2. Verify user has sufficient tweet history (>20 tweets)
3. Check OpenAI API key is configured

## Next Steps

1. **Connect Accounts**: Start with Twitter OAuth
2. **Analyze Patterns**: Let the system learn your style
3. **Test Generation**: Generate a few tweets manually
4. **Configure Agent**: Set your preferences
5. **Start Agent**: Let it run autonomously
6. **Monitor**: Check activity logs and analytics

## Support

For issues or questions:
- Check activity logs: `SELECT * FROM activity_log WHERE user_id = 'your-id'`
- Review agent status endpoint
- Check Composio connection status
- Verify environment variables (COMPOSIO_API_KEY, OPENAI_API_KEY)
