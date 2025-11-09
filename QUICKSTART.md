# Nexa Social Media Integration - Quick Start

🎉 **Congratulations!** The comprehensive X (Twitter) and Reddit integration is now complete and ready for testing.

## What's New

Your Nexa AI Growth Agent can now:

✅ **Connect** to Twitter and Reddit via secure OAuth  
✅ **Analyze** your posting patterns and style using AI  
✅ **Generate** content that authentically matches your voice  
✅ **Post** automatically on your schedule  
✅ **Engage** autonomously with relevant content  
✅ **Monitor** everything in real-time  

## Quick Start (5 Minutes)

### 1. Set Environment Variables

```bash
# Required for full functionality
COMPOSIO_API_KEY=your_composio_api_key
OPENAI_API_KEY=your_openai_api_key

# Already configured (Supabase)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

Server runs at http://localhost:3000

### 4. Test the Features

#### Connect Twitter Account
```bash
# Visit in browser (logged in):
http://localhost:3000/api/composio/start-auth?toolkit=twitter
```

#### Analyze Your Tweet Patterns
```bash
curl -X GET "http://localhost:3000/api/twitter/patterns" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

#### Generate Content in Your Style
```bash
curl -X POST "http://localhost:3000/api/twitter/generate" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "topic": "AI automation",
    "context": "Benefits for small businesses"
  }'
```

#### Start Autonomous Agent
```bash
curl -X POST "http://localhost:3000/api/agent/autonomous" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

## Using the UI Component

Add to your dashboard:

```tsx
import { AutonomousAgentControl } from '@/components/dashboard/AutonomousAgentControl';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <AutonomousAgentControl />
    </div>
  );
}
```

The component provides:
- Start/stop agent controls
- Real-time status
- Pattern analysis
- Activity monitoring

## Configuration

Configure the agent via `users.onboarding_data`:

```sql
UPDATE users 
SET onboarding_data = jsonb_set(
  COALESCE(onboarding_data, '{}'),
  '{auto_post_enabled}',
  'true'
)
WHERE id = 'your-user-id';
```

**Key Settings:**
- `auto_post_enabled` - Enable auto-posting
- `posting_frequency` - 'hourly', 'daily', 'twice_daily', 'custom'
- `auto_engage_enabled` - Enable auto-engagement
- `auto_like`, `auto_retweet`, `auto_reply` - Engagement types
- `min_engagement_score` - Threshold (0-100)
- `content_topics` - What to post about
- `target_audience` - Who you're targeting

## Production Deployment

### Start Workers (Required for Autonomous Operations)

```bash
# In separate terminal or as background service
pnpm workers
```

This will:
- Auto-start agents for enabled users
- Monitor agent health
- Handle graceful shutdown

### Deploy to Production

```bash
# Build
pnpm build

# Start
pnpm start

# Start workers (separate service/container)
pnpm workers
```

**Recommended Setup:**
- Main app on Vercel/Railway/Render
- Workers on separate Railway/Render service
- Use environment variable for all API keys
- Monitor logs for errors

## Documentation

📚 **Comprehensive Guides:**

- **[SOCIAL_MEDIA_INTEGRATION_GUIDE.md](./SOCIAL_MEDIA_INTEGRATION_GUIDE.md)** - Complete user guide with examples
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Technical architecture and API docs
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Full test plan and procedures
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was built and why

## Key Files

**Services:**
- `/src/services/composioIntegration.ts` - Composio API integration
- `/src/services/autonomousAgent.ts` - Background agent

**API Routes:**
- `/app/api/agent/autonomous/route.ts` - Agent control
- `/app/api/twitter/analyze/route.ts` - Tweet analysis
- `/app/api/twitter/patterns/route.ts` - Pattern detection
- `/app/api/twitter/generate/route.ts` - Content generation

**UI:**
- `/components/dashboard/AutonomousAgentControl.tsx` - Agent dashboard

**Workers:**
- `/scripts/start-workers.ts` - Worker process

## Example Workflow

1. **User connects Twitter account** via OAuth
2. **System analyzes patterns** from 100 recent tweets
3. **AI learns user's style** (voice, hooks, structure, themes)
4. **User starts agent** with custom configuration
5. **Agent generates content** matching user's style
6. **Agent posts on schedule** (e.g., daily at 9 AM)
7. **Agent finds relevant tweets** to engage with
8. **Agent scores relevance** (0-100) using AI
9. **Agent auto-engages** (like/retweet/reply) if score > threshold
10. **Everything is logged** for monitoring and analytics

## Common Issues

### "Composio not initialized"
- Check `COMPOSIO_API_KEY` is set
- Restart development server

### "No twitter connection found"
- Complete OAuth flow first
- Check `composio_connections` table

### Pattern analysis fails
- Ensure account has 20+ tweets
- Check `OPENAI_API_KEY` is valid

### Agent not posting
- Verify `auto_post_enabled: true` in config
- Check posting schedule matches current time
- Ensure agent is started

## Monitoring

Check activity logs:

```sql
-- Recent agent activity
SELECT * FROM activity_log 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 20;

-- Recent posts
SELECT * FROM posts 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Agent status
SELECT status, onboarding_data->'auto_post_enabled' 
FROM users 
WHERE id = 'your-user-id';
```

## What's Next?

After testing:

1. **Gather feedback** from real users
2. **Fine-tune** engagement thresholds
3. **Monitor** API usage and costs
4. **Iterate** on content quality
5. **Add** more platforms (LinkedIn, Instagram)

## Support

- Read the guides in `/SOCIAL_MEDIA_INTEGRATION_GUIDE.md`
- Check `/TESTING_GUIDE.md` for test procedures
- Review `/DEVELOPER_GUIDE.md` for technical details
- Enable debug mode: `DEBUG_COMPOSIO=true`

## Success Criteria

✅ Users can connect Twitter/Reddit  
✅ Pattern analysis completes successfully  
✅ Generated content matches user's voice  
✅ Agent posts autonomously  
✅ Auto-engagement works with relevant content  
✅ All activities are logged  
✅ Users can start/stop agent  

---

**Status:** ✅ Ready for Testing  
**Version:** 1.0.0  
**Date:** November 9, 2025  
**Total Implementation:** ~1,500 lines of code + 53,000 words of documentation
