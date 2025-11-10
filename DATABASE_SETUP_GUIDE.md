# Nexa Database Setup Guide

Complete guide for setting up the Supabase database for Nexa's social media integration features.

## Prerequisites

- Supabase project created
- Access to Supabase SQL Editor
- All environment variables configured in Vercel

## Step-by-Step Setup

### 1. Run Main Schema

First, run the main schema file to create all base tables:

**File:** `supabase/migrations/nexa_schema.sql`

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy the entire contents of `nexa_schema.sql`
5. Run the query
6. Verify no errors

**This creates:**
- ✅ Users table with plan, subscription, credits
- ✅ Connected accounts (Twitter, Reddit)
- ✅ Conversations and messages
- ✅ Posts (scheduled, published)
- ✅ Campaigns
- ✅ Composio connections
- ✅ Analytics tracking
- ✅ Activity logs
- ✅ OAuth state management

### 2. Run Social Media Integration Migration

Next, run the social media-specific enhancements:

**File:** `supabase/migrations/20251110_social_media_integration.sql`

1. In Supabase SQL Editor
2. Create a new query
3. Copy the entire contents of `20251110_social_media_integration.sql`
4. Run the query
5. Verify no errors

**This adds:**
- ✅ Additional columns to composio_connections (status, account_username, account_id)
- ✅ Credits and credits_used columns to users
- ✅ Indexes for performance optimization
- ✅ Row Level Security (RLS) policies
- ✅ Helpful views (active_connections, user_social_stats)
- ✅ Helper functions (log_social_action, deduct_credits)

### 3. Run Other Migrations (In Order)

Run the remaining migrations in chronological order:

1. **20251106_payg_credits.sql** - Pay-as-you-go credits system
2. **20251107_schedule_cancel_enum.sql** - Schedule cancellation types
3. **20251107_scheduling.sql** - Advanced scheduling features
4. **20251108_add_provider_tx_id.sql** - Payment provider transaction IDs

For each file:
1. Open in Supabase SQL Editor
2. Copy contents
3. Run query
4. Verify no errors

## Verification

After running all migrations, verify the setup:

### Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables:**
- activity_log
- analytics
- campaigns
- composio_connections ✓
- connected_accounts
- conversations
- messages
- oauth_states
- posts
- subscriptions
- users

### Check Composio Connections Structure

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'composio_connections' 
ORDER BY ordinal_position;
```

**Expected columns:**
- id (uuid)
- user_id (uuid) 
- composio_connection_id (text)
- toolkit_slug (text)
- meta (jsonb)
- status (text) ✓
- account_username (text) ✓
- account_id (text) ✓
- created_at (timestamp)
- updated_at (timestamp)

### Check Users Table Has Credits

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('credits', 'credits_used', 'onboarding_data');
```

**Expected:**
- credits ✓
- credits_used ✓
- onboarding_data ✓

### Check Views Created

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

**Expected views:**
- active_connections ✓
- user_social_stats ✓

### Check Functions Created

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected functions:**
- deduct_credits ✓
- log_social_action ✓
- update_updated_at_column ✓

## Sample Data (Optional)

For testing, you can add a test user:

```sql
INSERT INTO users (email, name, plan, credits, status) 
VALUES ('test@nexa.com', 'Test User', 'growth', 100, 'active')
ON CONFLICT (email) DO NOTHING
RETURNING id, email, credits;
```

## Common Issues and Solutions

### Issue 1: "relation already exists"
**Solution:** The migration handles this with `IF NOT EXISTS` clauses. Safe to ignore.

### Issue 2: "function does not exist"
**Solution:** Ensure `nexa_schema.sql` ran first to create base functions.

### Issue 3: "column already exists"
**Solution:** Migration checks for existing columns. Safe to re-run.

### Issue 4: RLS prevents access
**Solution:** Check that RLS policies are created and auth.uid() matches user_id.

## Environment Variables Required

Ensure these are set in Vercel:

### Database (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### OAuth (Composio)
```bash
COMPOSIO_API_KEY=your-composio-api-key
```

### AI (OpenAI)
```bash
OPENAI_API_KEY=your-openai-api-key
```

### App URLs
```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Testing the Setup

### 1. Test Database Connection

In your app's API route or server action:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test query
const { data, error } = await supabase
  .from('users')
  .select('id, email')
  .limit(1);

console.log('Database test:', { data, error });
```

### 2. Test User Creation

```sql
-- Check if test user was created
SELECT id, email, name, plan, credits, status
FROM users
WHERE email = 'test@nexa.com';
```

### 3. Test Connection Insert

```sql
-- Simulate a Composio connection
INSERT INTO composio_connections (
    user_id,
    composio_connection_id,
    toolkit_slug,
    account_username,
    status
)
VALUES (
    (SELECT id FROM users WHERE email = 'test@nexa.com'),
    'test_connection_123',
    'twitter',
    '@testuser',
    'active'
)
RETURNING *;
```

### 4. Test Credits Function

```sql
-- Test deducting credits
SELECT deduct_credits(
    (SELECT id FROM users WHERE email = 'test@nexa.com'),
    1
);

-- Check credits were deducted
SELECT credits, credits_used 
FROM users 
WHERE email = 'test@nexa.com';
```

### 5. Test Activity Logging

```sql
-- Log a test action
SELECT log_social_action(
    (SELECT id FROM users WHERE email = 'test@nexa.com'),
    'post_tweet',
    'twitter',
    'Posted test tweet',
    '{"tweet_id": "123", "content": "Hello World"}'::jsonb
);

-- Check activity was logged
SELECT * FROM activity_log 
WHERE user_id = (SELECT id FROM users WHERE email = 'test@nexa.com')
ORDER BY created_at DESC 
LIMIT 1;
```

## Database Schema Overview

### Core Tables

**users**
- User accounts with plans, subscriptions, credits
- Stores onboarding_data (JSONB) for agent configuration

**composio_connections**
- OAuth connections to Twitter/Reddit via Composio
- Links users to their connected social media accounts
- Tracks connection status and metadata

**posts**
- Social media posts (draft, scheduled, published)
- Links to composio_connections for platform posting
- Tracks scheduling and publishing status

**connected_accounts**
- Alternative connection storage (if not using Composio)
- Stores OAuth tokens directly

**campaigns**
- Multi-post campaigns across platforms
- Schedule multiple posts over time

**conversations & messages**
- Chat history with AI agent
- Supports web and WhatsApp sources

**activity_log**
- Audit trail of all user actions
- Used for monitoring and analytics

**analytics**
- Social media performance metrics
- Impressions, engagements, likes, etc.

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- No cross-user data leakage
- Service role can access all data (for admin functions)

### Policies Applied

```sql
-- Example: Users can only view their own connections
CREATE POLICY "Users can view own composio connections"
    ON composio_connections FOR SELECT
    USING (auth.uid() = user_id);
```

## Monitoring

### Check Active Connections

```sql
SELECT * FROM active_connections
ORDER BY created_at DESC;
```

### Check User Stats

```sql
SELECT * FROM user_social_stats
WHERE user_email = 'user@example.com';
```

### Recent Activity

```sql
SELECT 
    u.email,
    al.action,
    al.description,
    al.created_at
FROM activity_log al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 20;
```

## Backup and Recovery

### Export Schema

```bash
pg_dump -h your-db-host -U postgres -d postgres --schema-only > schema_backup.sql
```

### Export Data

```bash
pg_dump -h your-db-host -U postgres -d postgres --data-only > data_backup.sql
```

## Next Steps

After database setup:

1. ✅ Verify all migrations ran successfully
2. ✅ Check environment variables in Vercel
3. ✅ Deploy application to Vercel
4. ✅ Test OAuth connection flow
5. ✅ Test API endpoints
6. ✅ Test chat integration
7. ✅ Monitor activity logs

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard > Database > Logs
2. Verify all migrations completed without errors
3. Ensure RLS policies are correctly applied
4. Check that service role key has proper permissions
5. Review the verification queries above

## Database Diagram

```
users (id, email, credits, onboarding_data)
  ├── composio_connections (user_id, toolkit_slug, status)
  ├── posts (user_id, platform, status, scheduled_at)
  ├── campaigns (user_id, platforms[], status)
  ├── conversations (user_id, source)
  │   └── messages (conversation_id, role, content)
  ├── activity_log (user_id, action, metadata)
  └── subscriptions (user_id, plan, status)
```

## Production Readiness Checklist

- [ ] All migrations executed successfully
- [ ] RLS policies verified and working
- [ ] Indexes created for performance
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Environment variables configured
- [ ] Test user can connect OAuth
- [ ] Test user can post via API
- [ ] Credits system working
- [ ] Activity logging working
- [ ] Vercel deployment successful
- [ ] No build errors

**Status:** Ready for production deployment! 🚀
