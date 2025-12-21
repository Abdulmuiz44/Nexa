# Composio OAuth Configuration Guide

Complete step-by-step guide to set up Twitter and Reddit OAuth apps in Composio for Nexa.

---

## Prerequisites

Before starting, you need:
- Composio account (https://composio.dev)
- Twitter Developer account access
- Reddit Developer account access
- Your domain/URL (development: http://localhost:3000, production: https://yourdomain.com)

---

## Part 1: Twitter/X OAuth Configuration

### Step 1.1: Get Twitter API Credentials

1. Go to **https://developer.twitter.com/en/portal/dashboard**
2. Sign in with your Twitter developer account
3. Create a new project or select existing one
4. Go to **"Keys and tokens"** tab
5. Under **"Authentication Tokens"**, create or view your app's keys:
   - **API Key** (Consumer Key)
   - **API Secret Key** (Consumer Secret)
   - Keep these safe - you'll need them

### Step 1.2: Configure Twitter App Settings

1. Still in Twitter Developer Portal, go to **"App Settings"**
2. Under **"Authentication Settings"**:
   - Enable **"3-legged OAuth"**
   - Set **Callback URL / Redirect URL** to:
     ```
     https://yourcomposio-domain.composio.dev/oauth/callback
     ```
     (or your Composio sandbox URL - we'll configure this in Composio next)
   
   - Set **Website URL** to:
     ```
     https://yourdomain.com
     ```
   
   - Enable these OAuth permissions:
     ```
     • tweet.read
     • tweet.write
     • tweet.moderate.write
     • users.read
     • follows.read
     • follows.write
     • likes.read
     • likes.write
     • retweets.read
     • retweets.write
     • list.read
     • list.write
     • mute.read
     • mute.write
     • block.read
     • block.write
     ```

3. Click **"Save"**

### Step 1.3: Create Composio Connection for Twitter

1. Go to **https://composio.dev** dashboard
2. Navigate to **"Integrations"** or **"Connections"**
3. Search for **"Twitter"** or **"X"**
4. Click **"Add Integration"** or **"Create Connection"**
5. Select **OAuth 2.0** as auth type
6. Fill in:
   ```
   App Name: Twitter / X
   Client ID: (Your Twitter API Key)
   Client Secret: (Your Twitter API Secret Key)
   Redirect URI: https://yourdomain.com/api/composio/callback
   ```

7. Click **"Configure"** or **"Save"**
8. Composio will show you an **Auth Config ID** (looks like `ac_vUASEFFIWuaE`)
   - **COPY THIS** - you need it in your code

9. In your `.env.local` or `.env.production`:
   ```
   # Twitter
   COMPOSIO_TWITTER_AUTH_CONFIG_ID=ac_vUASEFFIWuaE
   ```

### Step 1.4: Update Nexa Code with Twitter Auth Config

Edit `src/services/composioIntegration.ts`:

```typescript
async initiateTwitterConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
  if (!this.composio) {
    throw new Error('Composio not initialized - COMPOSIO_API_KEY missing');
  }

  try {
    const callbackUrl = redirectUri || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/callback`;

    console.log('Initiating Twitter connection for entity:', this.userId);

    const session = await this.composio.connectedAccounts.initiate({
      appName: 'twitter',
      entityId: this.userId,
      authConfigId: process.env.COMPOSIO_TWITTER_AUTH_CONFIG_ID || 'ac_vUASEFFIWuaE', // ← Use env var
      redirectUrl: callbackUrl,
    });

    console.log('Composio session created:', session);

    return {
      authUrl: session.redirectUrl || session.url || '',
      connectionId: session.connectionId || session.id || '',
    };
  } catch (error: any) {
    console.error('Error initiating Twitter connection:', error);
    throw error;
  }
}
```

---

## Part 2: Reddit OAuth Configuration

### Step 2.1: Get Reddit API Credentials

1. Go to **https://www.reddit.com/prefs/apps** (while logged into your Reddit account)
2. Scroll to bottom: **"Developed Applications"**
3. Click **"Create Another App"** or **"Create App"**
4. Fill in:
   ```
   Name: Nexa (or your app name)
   App type: Select "Web app"
   Description: Growth automation platform for Reddit
   Redirect URI: https://yourdomain.com/api/composio/callback
   ```
5. Click **"Create App"**
6. You'll see:
   - **Client ID** (under your app name)
   - **Client Secret** (click "show" to reveal)
   - Keep these safe

### Step 2.2: Configure Reddit App Settings

Reddit apps created via the dashboard are automatically configured. However:

1. Go back to **https://www.reddit.com/prefs/apps**
2. Click **"Edit"** on your app
3. Verify:
   - Redirect URI is set to: `https://yourdomain.com/api/composio/callback`
   - App type is "Web app"
4. Save changes

### Step 2.3: Create Composio Connection for Reddit

1. Go to **https://composio.dev** dashboard
2. Navigate to **"Integrations"** or **"Connections"**
3. Search for **"Reddit"**
4. Click **"Add Integration"** or **"Create Connection"**
5. Select **OAuth 2.0** as auth type
6. Fill in:
   ```
   App Name: Reddit
   Client ID: (Your Reddit Client ID)
   Client Secret: (Your Reddit Client Secret)
   Redirect URI: https://yourdomain.com/api/composio/callback
   ```

7. Click **"Configure"** or **"Save"**
8. Composio will show you an **Auth Config ID**
   - **COPY THIS** - you need it in your code

9. In your `.env.local` or `.env.production`:
   ```
   # Reddit
   COMPOSIO_REDDIT_AUTH_CONFIG_ID=ac_xxxxx...
   ```

### Step 2.4: Update Nexa Code with Reddit Auth Config

Edit `src/services/composioIntegration.ts`:

```typescript
async initiateRedditConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
  if (!this.composio) {
    throw new Error('Composio not initialized - COMPOSIO_API_KEY missing');
  }

  try {
    const callbackUrl = redirectUri || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/composio/callback`;

    console.log('Initiating Reddit connection for entity:', this.userId);

    const session = await this.composio.connectedAccounts.initiate({
      appName: 'reddit',
      entityId: this.userId,
      authConfigId: process.env.COMPOSIO_REDDIT_AUTH_CONFIG_ID, // ← Use env var
      redirectUrl: callbackUrl,
    });

    return {
      authUrl: session.redirectUrl || session.url || '',
      connectionId: session.connectionId || session.id || '',
    };
  } catch (error: any) {
    console.error('Error initiating Reddit connection:', error);
    throw error;
  }
}
```

---

## Part 3: Environment Variables Setup

### Development (.env.local)

```bash
# Composio
COMPOSIO_API_KEY=your_composio_api_key
COMPOSIO_TWITTER_AUTH_CONFIG_ID=ac_vUASEFFIWuaE
COMPOSIO_REDDIT_AUTH_CONFIG_ID=ac_xxxxx...

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### Production (.env.production)

```bash
# Composio
COMPOSIO_API_KEY=your_composio_api_key
COMPOSIO_TWITTER_AUTH_CONFIG_ID=ac_vUASEFFIWuaE
COMPOSIO_REDDIT_AUTH_CONFIG_ID=ac_xxxxx...

# Next Auth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_production_secret_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### Update Code to Use Env Variables

`src/services/composioIntegration.ts`:

```typescript
async initiateTwitterConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
  // ... existing code ...
  const session = await this.composio.connectedAccounts.initiate({
    appName: 'twitter',
    entityId: this.userId,
    authConfigId: process.env.COMPOSIO_TWITTER_AUTH_CONFIG_ID || 'ac_vUASEFFIWuaE',
    redirectUrl: callbackUrl,
  });
  // ...
}

async initiateRedditConnection(redirectUri?: string): Promise<{ authUrl: string; connectionId: string }> {
  // ... existing code ...
  const session = await this.composio.connectedAccounts.initiate({
    appName: 'reddit',
    entityId: this.userId,
    authConfigId: process.env.COMPOSIO_REDDIT_AUTH_CONFIG_ID,
    redirectUrl: callbackUrl,
  });
  // ...
}
```

---

## Part 4: Testing OAuth Flow Locally

### Step 4.1: Start Development Server

```bash
npm run dev
```

### Step 4.2: Test Twitter Connection

1. Navigate to: `http://localhost:3000/dashboard/connections`
2. Click **"Connect X"** button
3. You should be redirected to Twitter OAuth consent screen
4. Click **"Authorize"**
5. You'll be redirected back to `http://localhost:3000/api/composio/callback?...`
6. If successful, you'll see success message and connection in list
7. If error, check:
   - Redirect URI matches in both Twitter & Composio
   - Auth Config ID is correct
   - COMPOSIO_API_KEY is set

### Step 4.3: Test Reddit Connection

1. On same page, click **"Connect Reddit"** button
2. You should be redirected to Reddit OAuth consent screen
3. Click **"Allow"**
4. You'll be redirected back to callback URL
5. Check for success message
6. If error, verify:
   - Redirect URI matches in Reddit & Composio
   - Auth Config ID is correct
   - Client ID & Secret are correct

### Step 4.4: Test Disconnect

1. Click **"Disconnect"** button on connected account
2. Verify account is removed from list
3. Check Supabase `audit_logs` table for revocation event

---

## Part 5: Troubleshooting

### Problem: "Invalid Redirect URI"

**Solution:**
1. Check redirect URI in Twitter/Reddit app settings
2. Check redirect URI in Composio integration
3. Ensure they match **exactly** (including http/https and no trailing slash)
4. For local development use: `http://localhost:3000/api/composio/callback`
5. For production use: `https://yourdomain.com/api/composio/callback`

### Problem: "Auth Config ID not found"

**Solution:**
1. In Composio dashboard, check Integration > Connections
2. Find your Twitter/Reddit connection
3. Copy the Auth Config ID (looks like `ac_xxxxx`)
4. Add to `.env.local`:
   ```bash
   COMPOSIO_TWITTER_AUTH_CONFIG_ID=ac_xxxxx
   ```
5. Restart dev server: `npm run dev`

### Problem: "User denied authorization"

**Solution:**
1. This is user action - they clicked "Deny" on OAuth screen
2. Nexa shows error: "OAuth failed: access_denied"
3. User can click "Connect X" again to retry
4. Check browser console for error details

### Problem: "COMPOSIO_API_KEY not set"

**Solution:**
1. Go to https://composio.dev/account or dashboard
2. Find **API Keys** section
3. Copy your API key
4. Add to `.env.local`:
   ```bash
   COMPOSIO_API_KEY=your_key_here
   ```
5. Restart dev server

### Problem: "Callback received but can't fetch account info"

**Solution:**
1. This is non-fatal - connection is still stored
2. Nexa will show warning: "Could not verify account"
3. But connection still works for posting/reading
4. To debug, check server logs for:
   ```
   [WARN] composio_account_verify_failed
   ```
5. This usually means Composio API is temporarily down - it will retry later

### Problem: Connections appear in DB but not in UI

**Solution:**
1. Refresh page (Ctrl+R)
2. Check browser Network tab - GET /api/composio/connections should return 200
3. Check Supabase - `composio_connections` table should have your connection
4. Verify RLS policies allow you to read your own connections:
   ```sql
   SELECT * FROM composio_connections WHERE user_id = auth.uid();
   ```

---

## Part 6: Verification Checklist

After setup, verify everything works:

### Twitter
- [ ] API credentials obtained from developer.twitter.com
- [ ] OAuth scopes enabled in Twitter app
- [ ] Composio integration created with correct credentials
- [ ] Auth Config ID copied to `.env.local`
- [ ] `initiateTwitterConnection()` uses env var
- [ ] Test: Click "Connect X" → Authorize → Success
- [ ] Connection appears in DB with account info

### Reddit
- [ ] App created on reddit.com/prefs/apps
- [ ] Redirect URI set correctly
- [ ] Composio integration created with correct credentials
- [ ] Auth Config ID copied to `.env.local`
- [ ] `initiateRedditConnection()` uses env var
- [ ] Test: Click "Connect Reddit" → Allow → Success
- [ ] Connection appears in DB with account info

### General
- [ ] `.env.local` has all required keys
- [ ] `NEXTAUTH_URL` matches domain
- [ ] Redirect URIs consistent everywhere (Twitter, Reddit, Composio, Nexa)
- [ ] Database migrations applied (`auth_sessions`, `audit_logs`)
- [ ] RLS policies enabled on `composio_connections`
- [ ] Rate limiting working (test 6 rapid auth attempts)
- [ ] Disconnect revokes connection properly
- [ ] Audit logs recorded for all events

---

## Part 7: Production Deployment

### Before Going Live

1. **Update NEXTAUTH_URL:**
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. **Update Redirect URIs** in:
   - Twitter app settings
   - Reddit app settings
   - Composio integrations (may need to recreate with new redirect URI)

3. **Get Production Auth Config IDs** from Composio for production credentials

4. **Update .env.production:**
   ```bash
   COMPOSIO_TWITTER_AUTH_CONFIG_ID=ac_prod_xxxxx
   COMPOSIO_REDDIT_AUTH_CONFIG_ID=ac_prod_xxxxx
   ```

5. **Test in staging first** with production credentials

6. **Monitor logs** after deployment for OAuth errors

---

## Part 8: Quick Reference

### Redirect URI Templates

```
Development:  http://localhost:3000/api/composio/callback
Staging:      https://staging.yourdomain.com/api/composio/callback
Production:   https://yourdomain.com/api/composio/callback
```

### Key Files Modified

```
src/services/composioIntegration.ts
  → initiateTwitterConnection()
  → initiateRedditConnection()

.env.local / .env.production
  → COMPOSIO_TWITTER_AUTH_CONFIG_ID
  → COMPOSIO_REDDIT_AUTH_CONFIG_ID
  → COMPOSIO_API_KEY
  → NEXTAUTH_URL
```

### Environment Variables Summary

| Variable | Source | Purpose |
|----------|--------|---------|
| `COMPOSIO_API_KEY` | Composio Dashboard | Authenticate with Composio API |
| `COMPOSIO_TWITTER_AUTH_CONFIG_ID` | Composio Integration Settings | Twitter OAuth config reference |
| `COMPOSIO_REDDIT_AUTH_CONFIG_ID` | Composio Integration Settings | Reddit OAuth config reference |
| `NEXTAUTH_URL` | Your Domain | OAuth callback base URL |
| `NEXTAUTH_SECRET` | Generated (any random string) | Session encryption |

---

## Part 9: Testing Commands

### Check if env vars are loaded:
```bash
# In your Next.js app
console.log(process.env.COMPOSIO_API_KEY) // Should not be undefined
```

### Test OAuth flow manually:
```bash
# 1. Start dev server
npm run dev

# 2. Visit connections page
open http://localhost:3000/dashboard/connections

# 3. Click "Connect X"
# 4. Should redirect to https://twitter.com/oauth/authorize?...

# 5. After authorizing, should redirect to:
# http://localhost:3000/api/composio/callback?connectionId=...&state=...

# 6. If success, redirects to:
# http://localhost:3000/dashboard/connections?success=...
```

### Debug OAuth flow:
```bash
# Check browser console for errors
# Check Network tab for API calls
# Check server logs for detailed error messages

# Look for these log messages:
# [INFO] composio_auth_session_created
# [INFO] composio_account_verified
# [INFO] composio_connection_created
```

---

## 📚 Additional Resources

- **Composio Docs:** https://docs.composio.dev
- **Twitter API Docs:** https://developer.twitter.com/en/docs
- **Reddit API Docs:** https://www.reddit.com/dev/api
- **OAuth 2.0 Flow:** https://tools.ietf.org/html/rfc6749

---

**Status:** Ready for Configuration  
**Last Updated:** Dec 21, 2025
