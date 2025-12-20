# End-to-End Workflow Testing Guide

## Quick Start (5 minutes)

### 1. Start the dev server
```bash
npm run dev
```

### 2. Navigate to the demo
```
http://localhost:3000/dashboard/workflow-demo
```

### 3. Fill in the form
- **Brief**: "We just launched an AI-powered social media manager"
- **Platforms**: Select Twitter and Reddit
- **Click**: "Start Workflow"

### 4. Watch real-time updates
- Execution log updates as each step progresses
- Content appears once generated
- Metrics show after publishing

---

## Test Scenarios

### Scenario 1: Basic Workflow (All Platforms)

**Setup:**
```
Brief: "Announcing our new feature that helps teams automate content creation"
Platforms: Twitter, Reddit, LinkedIn
```

**Expected Flow:**
```
1. ✓ Content generation started
2. ✓ Content generated for twitter, reddit, linkedin  (5-10 sec)
3. ✓ Content analysis (3-5 sec)
4. ✓ Publishing to twitter  (2-3 sec)
5. ✓ Publishing to reddit   (2-3 sec)
6. ✓ Publishing to linkedin (2-3 sec)
7. ✓ Metrics fetched for 3 posts
8. ✓ Workflow completed
```

**Verify:**
- [ ] Execution log shows all steps
- [ ] Each platform has generated content card
- [ ] Metrics show likes/comments/shares/views
- [ ] No errors in browser console

---

### Scenario 2: Single Platform Focus

**Setup:**
```
Brief: "Check out our latest blog post about AI trends"
Platforms: Twitter only
```

**Expected:**
- Faster execution (single platform)
- Twitter content optimized for 280 chars
- One metrics card for the post

---

### Scenario 3: Error Handling - Invalid Input

**Setup:**
```
Brief: (leave empty)
Click: "Start Workflow"
```

**Expected:**
- [ ] Alert: "Please enter a content brief"
- [ ] Workflow doesn't start

---

### Scenario 4: Stop Workflow Mid-Execution

**Setup:**
1. Start a workflow
2. Wait 2-3 seconds
3. Click "Stop" button

**Expected:**
- [ ] EventSource closes
- [ ] "Stop" button disappears
- [ ] Execution log stops updating
- [ ] UI remains responsive

---

### Scenario 5: Error in Composio Integration

**Simulate by:**
1. Temporarily stop Composio service (if running locally)
2. Start workflow
3. Wait for publishing step

**Expected:**
- [ ] Publishing step shows error
- [ ] Execution log displays: "✗ Error posting to [platform]"
- [ ] Error card appears at bottom
- [ ] Workflow completes despite error

---

## Manual API Testing

### Test Content Generation Only

```bash
curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "brief": "Test content generation",
    "toolkits": ["twitter", "reddit"]
  }'
```

**Expected Response:**
```json
{
  "twitter": "Tweet text...",
  "reddit": "Reddit post...",
  "analysis": "Analysis text...",
  "metadata": {
    "generatedAt": 1703000000000,
    "model": "mistral-large-latest",
    "tokensUsed": 450
  }
}
```

---

### Test Streaming Workflow

```bash
curl -X POST http://localhost:3000/api/agents/stream \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "brief": "Test streaming workflow",
    "toolkits": ["twitter"]
  }'
```

**Expected Response (SSE format):**
```
data: {"type":"state_update","payload":{"executionLog":["Starting workflow...","✓ Content generated for twitter"]}}

data: {"type":"state_update","payload":{"executionLog":["Starting workflow...","✓ Content generated for twitter","✓ Posted to twitter: post_123"]}}

data: {"type":"complete","payload":{"status":"success"}}
```

---

## Browser DevTools Debugging

### Network Tab
1. Open DevTools → Network tab
2. Filter: XHR/Fetch
3. Start workflow
4. Click `/api/agents/stream` request
5. Check:
   - Status: 200
   - Content-Type: text/event-stream
   - Response preview shows SSE events

### Console Tab
1. Check for JavaScript errors
2. Look for logs from `useStreamingAgent` hook
3. Verify SSE event parsing:
   ```javascript
   // Should see updates like:
   // {type: "state_update", payload: {...}}
   ```

### Application Tab (Storage)
1. Check cookies for `next-auth.session-token`
2. Verify session is active
3. Check localStorage for any state management

---

## Performance Testing

### Measure Response Time

**Content Generation:**
```bash
time curl -X POST http://localhost:3000/api/agents/run \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"brief":"Test","toolkits":["twitter","reddit","linkedin"]}'
```

**Expected:** 8-15 seconds (depends on Mistral API)

### Measure Streaming Time

1. Open Network tab
2. Start workflow
3. Note time from request to first "state_update" event
4. Note time to "complete" event

**Expected:** 
- First update: 2-3 seconds
- Complete: 20-30 seconds for full workflow

---

## Content Verification

### Check Generated Content

After workflow completes, verify each platform's content:

**Twitter:**
- [ ] Max 280 characters
- [ ] Contains relevant hashtags
- [ ] Proper grammar and spelling
- [ ] Includes call-to-action

**Reddit:**
- [ ] Longer form (title + body)
- [ ] Community-friendly tone
- [ ] Discussion hooks
- [ ] No promotional spam

**LinkedIn:**
- [ ] Professional tone
- [ ] Insights or lessons
- [ ] Industry-relevant
- [ ] Proper formatting

---

## Analytics Verification

Check metrics display:
- [ ] Post IDs match published content
- [ ] Metrics values are reasonable (0-1000 range)
- [ ] All metric types shown (likes, comments, shares, views)
- [ ] Proper formatting and colors

---

## Error Scenarios & Fixes

### Issue: "Authorization Failed"
**Cause:** Session expired or cookies not sent
**Fix:** 
1. Refresh page
2. Check DevTools → Application → Cookies
3. Verify `next-auth.session-token` exists
4. Re-login if needed

---

### Issue: "No updates in execution log"
**Cause:** Workflow didn't start or SSE connection failed
**Fix:**
1. Check browser console for errors
2. Check Network tab for 200 response
3. Verify API route is accessible
4. Check server logs: `tail -f dev.log | grep "streaming_agent"`

---

### Issue: "Content not appearing"
**Cause:** Content generation failed silently
**Fix:**
1. Check MISTRAL_API_KEY is valid
2. Check .env.local has key
3. View server logs for Mistral errors
4. Test via `/api/agents/run` directly

---

### Issue: "Metrics show but content doesn't"
**Cause:** Publishing succeeded but content generation failed
**Fix:**
1. Check error in error card at bottom
2. Verify Composio integration is active
3. Check Composio credentials in Supabase

---

## Load Testing (Advanced)

### Test with Multiple Concurrent Workflows

```bash
# Terminal 1
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/agents/stream \
    -H "Content-Type: application/json" \
    -H "Cookie: YOUR_SESSION_COOKIE" \
    -d '{"brief":"Load test '$i'","toolkits":["twitter"]}' &
done
wait
```

**Monitor:**
- CPU usage
- Memory usage
- Response times
- Any connection errors

---

## Checklist Before Production

- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Streaming works reliably (tested 5+ times)
- [ ] Error handling catches edge cases
- [ ] Performance acceptable (<30s for full workflow)
- [ ] Content quality verified
- [ ] Metrics display correctly
- [ ] Mobile responsive (test on smaller screens)
- [ ] Session management works
- [ ] Environment variables configured
- [ ] Logging captures all events
- [ ] Rate limiting not triggered

---

## Continuous Testing

### Monitor for Issues
```bash
# Watch logs
tail -f dev.log | grep -i "error\|streaming"

# Check API health
watch -n 5 'curl -s http://localhost:3000/api/health | jq .'
```

### Automated Testing (Future)
```bash
# Setup Playwright E2E tests
npm run test:e2e

# Test specific scenario
npm run test:e2e -- --grep "workflow"
```

---

## Support & Debugging

### Get Full Logs
```bash
# Restart with verbose logging
LOGLEVEL=debug npm run dev

# Save to file
npm run dev > nexa.log 2>&1 &
tail -f nexa.log
```

### Check Dependencies
```bash
# Verify packages installed
npm ls @langchain/langgraph
npm ls @mistralai/mistralai

# Update if needed
npm update
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `MISTRAL_API_KEY is required` | Missing env var | Add to .env.local |
| `Unauthorized` | Not logged in | Check session |
| `Network error` | API unreachable | Check server running |
| `SSE timeout` | Connection lost | Reload page |
| `No content generated` | Mistral failed | Check API quota |

---

## Next Steps After E2E Tests Pass

1. **Deploy to staging**
   ```bash
   npm run build
   npm start
   ```

2. **Test in staging environment**
   - Verify all APIs reach production services
   - Test with real Composio credentials
   - Monitor error logs

3. **Deploy to production**
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

4. **Monitor in production**
   - Set up error tracking (Sentry)
   - Monitor API response times
   - Track user engagement metrics
