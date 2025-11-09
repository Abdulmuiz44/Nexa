# Nexa Social Media Integration - Testing Guide

## Overview

This guide provides step-by-step instructions for testing the new X (Twitter) and Reddit integration features.

## Prerequisites

Before testing, ensure you have:

1. **Environment Variables Set:**
   ```bash
   COMPOSIO_API_KEY=your_composio_api_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Dependencies Installed:**
   ```bash
   pnpm install
   ```

3. **Database Migrations Run:**
   ```bash
   # Run Supabase migrations
   supabase db reset
   ```

4. **Development Server Running:**
   ```bash
   pnpm dev
   ```

## Test Plan

### Phase 1: Authentication Testing

#### Test 1.1: Twitter OAuth Connection

**Objective:** Verify users can connect their Twitter account via Composio

**Steps:**
1. Log in to Nexa dashboard
2. Navigate to Connections page
3. Click "Connect Twitter" button
4. Complete OAuth flow on Twitter
5. Verify redirect back to Nexa
6. Check connection appears in database:
   ```sql
   SELECT * FROM composio_connections WHERE user_id = 'YOUR_USER_ID' AND toolkit_slug = 'twitter';
   ```

**Expected Result:**
- User is redirected to Twitter OAuth page
- After authorization, user is redirected back to Nexa
- Connection is saved in `composio_connections` table
- Success message displayed

**API Test:**
```bash
curl -X GET "http://localhost:3000/api/composio/connections" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

#### Test 1.2: Reddit OAuth Connection

**Objective:** Verify users can connect their Reddit account

**Steps:**
1. Navigate to Connections page
2. Click "Connect Reddit" button
3. Complete OAuth flow on Reddit
4. Verify redirect back to Nexa
5. Check connection in database

**Expected Result:**
- Similar to Twitter connection
- Reddit connection saved successfully

### Phase 2: Tweet Analysis Testing

#### Test 2.1: Single Tweet Analysis

**Objective:** Verify AI can analyze tweet characteristics

**Steps:**
1. Use API endpoint to analyze a sample tweet:
   ```bash
   curl -X POST "http://localhost:3000/api/twitter/analyze" \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{
       "tweetContent": "🚀 Just shipped a new feature! Our AI agent can now auto-engage with relevant content. This is going to save so much time. #AI #automation"
     }'
   ```

**Expected Result:**
```json
{
  "success": true,
  "analysis": {
    "sentiment": "positive",
    "topics": ["AI", "automation", "product launch"],
    "hooks": ["🚀 Just shipped"],
    "style": "Enthusiastic, casual",
    "voice": "Excited, promotional",
    "structure": "Announcement + benefit + hashtags",
    "engagement_potential": 75
  }
}
```

**Validation:**
- Sentiment is correctly identified
- Topics are relevant
- Hook phrase is detected
- Style and voice descriptions are accurate
- Engagement score is 0-100

#### Test 2.2: Pattern Detection

**Objective:** Verify system can analyze user's historical tweet patterns

**Prerequisites:**
- Twitter account must have at least 20 recent tweets

**Steps:**
1. Call pattern analysis endpoint:
   ```bash
   curl -X GET "http://localhost:3000/api/twitter/patterns" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

2. Check that patterns are saved:
   ```sql
   SELECT onboarding_data->'tweet_patterns' FROM users WHERE id = 'YOUR_USER_ID';
   ```

**Expected Result:**
```json
{
  "success": true,
  "patterns": {
    "common_hooks": ["Here's how", "Just launched", "Pro tip:"],
    "typical_structure": "Hook + explanation + call-to-action",
    "voice_characteristics": "Helpful, enthusiastic, casual",
    "engagement_patterns": {
      "best_time": "09:00",
      "best_day": "Tuesday",
      "avg_engagement": 3.5
    },
    "content_themes": ["AI", "productivity", "tools"]
  }
}
```

**Validation:**
- All pattern fields are populated
- Hooks reflect actual user style
- Voice description is accurate
- Best times are reasonable
- Themes match user's content

### Phase 3: Content Generation Testing

#### Test 3.1: Generate Tweet in User's Style

**Objective:** Verify AI can generate authentic-sounding tweets

**Prerequisites:**
- Pattern analysis completed (Test 2.2)

**Steps:**
1. Generate a tweet:
   ```bash
   curl -X POST "http://localhost:3000/api/twitter/generate" \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{
       "topic": "AI automation",
       "context": "Benefits for small businesses"
     }'
   ```

**Expected Result:**
```json
{
  "success": true,
  "content": "Pro tip: AI automation isn't just for big companies anymore. Small businesses can now automate repetitive tasks and focus on growth. Here's how to get started 👇 #AI #SmallBusiness"
}
```

**Validation:**
- Tweet uses user's common hooks
- Voice matches user's style
- Content is relevant to topic
- Under 280 characters
- Sounds authentic, not AI-generated

#### Test 3.2: Generate Multiple Tweets

**Steps:**
1. Generate 5 tweets on different topics
2. Verify each is unique
3. Check all match user's style

**Expected Result:**
- Each tweet is different
- All match user's voice and patterns
- No repetition in hooks or phrases

### Phase 4: Autonomous Agent Testing

#### Test 4.1: Agent Lifecycle

**Objective:** Verify agent can be started and stopped

**Steps:**
1. Start the agent:
   ```bash
   curl -X POST "http://localhost:3000/api/agent/autonomous" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

2. Check agent status:
   ```bash
   curl -X GET "http://localhost:3000/api/agent/autonomous" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

3. Verify activity log:
   ```sql
   SELECT * FROM activity_log 
   WHERE user_id = 'YOUR_USER_ID' 
   AND action = 'agent_started' 
   ORDER BY created_at DESC LIMIT 1;
   ```

4. Stop the agent:
   ```bash
   curl -X DELETE "http://localhost:3000/api/agent/autonomous" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

**Expected Result:**
- Start returns `{ success: true }`
- Status returns `{ isRunning: true, status: "active" }`
- Activity logged in database
- Stop returns `{ success: true }`
- Status returns `{ isRunning: false }`

#### Test 4.2: Autonomous Posting

**Objective:** Verify agent can generate and post content

**Prerequisites:**
- Agent configuration in onboarding_data:
  ```json
  {
    "auto_post_enabled": true,
    "posting_frequency": "hourly",
    "content_topics": ["AI", "automation"],
    "target_audience": "tech professionals"
  }
  ```

**Steps:**
1. Start agent
2. Wait for posting loop (up to 1 hour depending on schedule)
3. Check posts table:
   ```sql
   SELECT * FROM posts 
   WHERE user_id = 'YOUR_USER_ID' 
   AND metadata->>'generated_by' = 'autonomous_agent'
   ORDER BY created_at DESC;
   ```

4. Check activity log:
   ```sql
   SELECT * FROM activity_log 
   WHERE user_id = 'YOUR_USER_ID' 
   AND action = 'auto_tweet_posted'
   ORDER BY created_at DESC;
   ```

**Expected Result:**
- Post is created in database
- Content matches user's style
- Status is 'published' or 'scheduled'
- Activity is logged
- Actual tweet appears on Twitter (if not dry-run)

#### Test 4.3: Auto-Engagement

**Objective:** Verify agent can automatically engage with content

**Prerequisites:**
- Agent configuration:
  ```json
  {
    "auto_engage_enabled": true,
    "auto_like": true,
    "auto_retweet": false,
    "auto_reply": true,
    "min_engagement_score": 70
  }
  ```

**Steps:**
1. Start agent
2. Wait for engagement loop (10 minutes)
3. Check activity log:
   ```sql
   SELECT * FROM activity_log 
   WHERE user_id = 'YOUR_USER_ID' 
   AND action IN ('auto_like', 'auto_retweet', 'auto_reply')
   ORDER BY created_at DESC;
   ```

**Expected Result:**
- Engagement actions are logged
- Only high-scoring content is engaged with
- Rate limiting is respected (5 seconds between actions)

### Phase 5: Reddit Integration Testing

#### Test 5.1: Reddit Post Creation

**Objective:** Verify agent can post to Reddit

**Steps:**
1. Create a Reddit post via service:
   ```typescript
   const service = new ComposioIntegrationService(userId);
   const result = await service.postToReddit({
     subreddit: 'test',
     title: 'Testing Nexa Integration',
     content: 'This is a test post from Nexa AI agent'
   });
   ```

2. Check result
3. Verify post on Reddit

**Expected Result:**
- `result.success === true`
- Post ID is returned
- Post URL is returned
- Post appears on Reddit

### Phase 6: UI Component Testing

#### Test 6.1: AutonomousAgentControl Component

**Objective:** Verify UI component works correctly

**Steps:**
1. Navigate to dashboard
2. Add component to page:
   ```tsx
   import { AutonomousAgentControl } from '@/components/dashboard/AutonomousAgentControl';
   
   <AutonomousAgentControl />
   ```

3. Test start button
4. Verify status updates
5. Test pattern analysis button
6. Verify patterns display
7. Test stop button

**Expected Result:**
- All buttons are functional
- Status updates in real-time
- Patterns display correctly
- No console errors

### Phase 7: Worker Process Testing

#### Test 7.1: Worker Startup

**Objective:** Verify workers start agents on boot

**Steps:**
1. Set user status to 'agent_active':
   ```sql
   UPDATE users 
   SET status = 'agent_active',
       onboarding_data = jsonb_set(
         COALESCE(onboarding_data, '{}'),
         '{auto_post_enabled}',
         'true'
       )
   WHERE id = 'YOUR_USER_ID';
   ```

2. Start workers:
   ```bash
   npm run workers
   ```

3. Check logs for agent startup
4. Verify agent is running:
   ```bash
   curl -X GET "http://localhost:3000/api/agent/autonomous" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

**Expected Result:**
- Worker logs show agent started
- Agent status is 'active'
- Agent begins posting/engaging

### Phase 8: Error Handling Testing

#### Test 8.1: Invalid API Keys

**Steps:**
1. Set invalid COMPOSIO_API_KEY
2. Try to start agent
3. Check error handling

**Expected Result:**
- Graceful error message
- No crashes
- Error logged

#### Test 8.2: No Twitter Connection

**Steps:**
1. Remove Twitter connection
2. Try to post tweet
3. Check error handling

**Expected Result:**
- Clear error message: "No twitter connection found"
- Agent doesn't crash

#### Test 8.3: OpenAI API Failure

**Steps:**
1. Set invalid OPENAI_API_KEY
2. Try to analyze patterns
3. Check error handling

**Expected Result:**
- Graceful error handling
- Fallback behavior or clear error message

## Performance Testing

### Test P1: Pattern Analysis Performance

**Steps:**
1. Analyze patterns with 100 tweets
2. Measure time taken
3. Check token usage

**Acceptance Criteria:**
- Completes in < 60 seconds
- Uses < 10,000 tokens

### Test P2: Agent Memory Usage

**Steps:**
1. Start 10 agents simultaneously
2. Monitor memory usage
3. Run for 1 hour

**Acceptance Criteria:**
- Memory per agent < 100MB
- No memory leaks
- CPU usage < 10% per agent

### Test P3: Database Performance

**Steps:**
1. Generate 1000 posts
2. Query activity logs
3. Check query performance

**Acceptance Criteria:**
- Post creation < 100ms
- Log queries < 50ms
- No table locks

## Security Testing

### Test S1: Authentication

**Steps:**
1. Try to access endpoints without session
2. Verify 401 responses

**Expected Result:**
- All protected endpoints require authentication
- No data leakage

### Test S2: Cross-User Access

**Steps:**
1. Try to start agent for another user
2. Try to access another user's patterns

**Expected Result:**
- 403 Forbidden
- No cross-user data access

## Integration Testing

### Test I1: End-to-End Flow

**Steps:**
1. New user signs up
2. Completes onboarding
3. Connects Twitter account
4. Analyzes patterns
5. Starts agent
6. Agent posts a tweet
7. Agent engages with content

**Expected Result:**
- Complete flow works without errors
- All features integrate seamlessly

## Monitoring & Observability

### Metrics to Track

1. **Agent Activity:**
   ```sql
   SELECT action, COUNT(*) 
   FROM activity_log 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY action;
   ```

2. **Post Success Rate:**
   ```sql
   SELECT status, COUNT(*) 
   FROM posts 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY status;
   ```

3. **API Errors:**
   - Check application logs
   - Monitor Sentry/error tracking

## Test Checklist

- [ ] Twitter OAuth connection works
- [ ] Reddit OAuth connection works
- [ ] Single tweet analysis works
- [ ] Pattern detection works (20+ tweets)
- [ ] Content generation matches style
- [ ] Agent can be started/stopped
- [ ] Autonomous posting works
- [ ] Auto-engagement works
- [ ] Reddit posting works
- [ ] UI component is functional
- [ ] Workers start agents on boot
- [ ] Error handling is graceful
- [ ] Performance is acceptable
- [ ] Security is enforced
- [ ] End-to-end flow works

## Reporting Issues

When reporting bugs, include:

1. **Steps to reproduce**
2. **Expected vs actual behavior**
3. **Error messages/logs**
4. **Environment** (dev/prod)
5. **Database state** (relevant tables)
6. **User ID** (for debugging)

## Support

For testing questions:
- Check DEVELOPER_GUIDE.md for technical details
- Check SOCIAL_MEDIA_INTEGRATION_GUIDE.md for feature documentation
- Review activity_log for debugging
- Enable debug mode: `DEBUG_COMPOSIO=true`
