# Nexa OAuth Account Connection Architecture

## Overview
Complete OAuth flow for connecting social media accounts (X/Twitter & Reddit) via Composio, from UI to database storage.

---

## 1. USER JOURNEY

### Happy Path (User connects X account)
```
1. User lands on /dashboard/connections
   ↓
2. Clicks "Connect X" button
   ↓
3. Frontend: POST /api/composio/auth/twitter
   ↓
4. Backend: Creates auth_sessions record (pending state)
   ↓
5. Backend: Calls Composio OAuth initiate
   ↓
6. Composio returns authUrl (e.g., https://twitter.com/oauth/authorize?...)
   ↓
7. Frontend: Redirects window.location.href to authUrl
   ↓
8. User grants permission on Twitter/Composio
   ↓
9. Twitter redirects to /api/composio/callback?connectionId=X&state=Y
   ↓
10. Backend: Verifies state matches auth_sessions
   ↓
11. Backend: Creates/Updates composio_connections record (active)
   ↓
12. Backend: Marks auth_sessions as completed
   ↓
13. Backend: Redirects to /dashboard/connections?success=connected
   ↓
14. Frontend: Re-fetches connections via GET /api/composio/connections
   ↓
15. UI displays "✓ Active" badge and "Disconnect" button
```

---

## 2. DATABASE SCHEMA

### `auth_sessions` Table
Tracks OAuth flows in progress (ephemeral, cleanup after 24h recommended)
```sql
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    platform TEXT NOT NULL,              -- 'twitter' | 'reddit' | 'linkedin'
    state TEXT NOT NULL,                 -- connectionId from Composio
    status TEXT DEFAULT 'pending',       -- 'pending' → 'completed' → deleted
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '15 minutes'
);
```

### `composio_connections` Table
Stores active social media account tokens/auth (production data)
```sql
CREATE TABLE composio_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    composio_connection_id TEXT NOT NULL UNIQUE,  -- Composio's internal ID
    toolkit_slug TEXT NOT NULL,                   -- 'twitter' | 'reddit'
    status TEXT DEFAULT 'active',                 -- 'active' | 'expired' | 'revoked'
    account_username TEXT,                        -- @username for X, u/username for Reddit
    account_id TEXT,                              -- Platform account ID
    meta JSONB DEFAULT '{}',                      -- Extra data (follower_count, verified, etc)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_composio_connections_user_id ON composio_connections(user_id);
CREATE INDEX idx_composio_connections_toolkit ON composio_connections(toolkit_slug);
```

---

## 3. API ROUTES

### **POST /api/composio/auth/[platform]**
Initiates OAuth flow. Called by frontend when user clicks "Connect X" button.

**Request:**
```json
{
  "platform": "twitter" | "reddit" | "linkedin"
}
```

**Response (200):**
```json
{
  "success": true,
  "authUrl": "https://twitter.com/oauth/authorize?...",
  "connectionId": "conn_abc123",
  "platform": "twitter"
}
```

**What it does:**
1. Validates user is authenticated (session check)
2. Validates platform is supported
3. Creates `auth_sessions` record with state = connectionId
4. Calls `ComposioIntegrationService.initiateTwitterConnection()`
5. Returns authUrl for frontend redirect
6. User is sent to Composio/Twitter OAuth

---

### **GET /api/composio/callback**
Receives OAuth callback from Composio after user authorizes.

**Query Params:**
```
?connectionId=ABC&state=XYZ  // Success
?error=access_denied          // User denied
```

**What it does:**
1. Receives `connectionId` and `state` from Composio
2. Looks up `auth_sessions` where `state = ?`
3. If not found or expired → Error redirect
4. If found → Extract `user_id` and `platform`
5. Check if user already has connection for that platform:
   - **If yes:** Update existing record, mark status = 'active'
   - **If no:** Insert new record, mark status = 'active'
6. Populate `account_username` and `account_id` from Composio account info (first action)
7. Mark `auth_sessions.status = 'completed'`
8. Redirect to `/dashboard/connections?success=X%20connected`

---

### **GET /api/composio/connections**
Lists user's active connections. Called on page load and after disconnect.

**Response (200):**
```json
{
  "success": true,
  "connections": [
    {
      "id": "conn_123",
      "platform": "twitter",
      "username": "@myhandle",
      "status": "active",
      "connectedAt": "2025-12-21T10:30:00Z"
    },
    {
      "id": "conn_456",
      "platform": "reddit",
      "username": "u/myusername",
      "status": "active",
      "connectedAt": "2025-12-20T15:45:00Z"
    }
  ],
  "count": 2
}
```

**Query:**
```sql
SELECT id, toolkit_slug as platform, account_username as username, 
       status, created_at as connectedAt
FROM composio_connections
WHERE user_id = ? AND status = 'active'
ORDER BY created_at DESC;
```

---

### **DELETE /api/composio/connections?platform=twitter**
Revokes connection. User can disconnect at any time.

**What it does:**
1. Validate platform param
2. Find connection for user + platform
3. Attempt to revoke with Composio API (best-effort)
4. Delete from `composio_connections`
5. Return success

**Future:**
- Add to audit_log for security tracking
- Send user email "Connection removed"
- Prevent scheduled posts from running

---

## 4. FRONTEND FLOW

### `connections/page.tsx`

**On Mount:**
```tsx
useEffect(() => {
  fetchConnections(); // GET /api/composio/connections
}, []);
```

**Click "Connect X":**
```tsx
const connectPlatform = async (platform) => {
  const res = await fetch(`/api/composio/auth/${platform}`, {
    method: 'POST'
  });
  const data = await res.json();
  
  if (data.authUrl) {
    window.location.href = data.authUrl; // Redirect to OAuth
  }
};
```

**After OAuth (page refreshes):**
- Callback redirects back to `/connections?success=X%20connected`
- `useEffect` refetches connections
- UI updates with new badge

---

## 5. COMPOSIO INTEGRATION

### Service: `ComposioIntegrationService`

#### `initiateTwitterConnection(redirectUri?)`
```typescript
async initiateTwitterConnection(redirectUri?: string) {
  const callbackUrl = redirectUri || `${NEXTAUTH_URL}/api/composio/callback`;
  
  const session = await composio.connectedAccounts.initiate({
    appName: 'twitter',
    entityId: userId,
    authConfigId: 'ac_vUASEFFIWuaE',  // Pre-configured in Composio dashboard
    redirectUrl: callbackUrl,
  });
  
  return {
    authUrl: session.redirectUrl,
    connectionId: session.connectionId,
  };
}
```

**Note:** `authConfigId` is configured in Composio dashboard and tied to Twitter app credentials.

#### `initiateRedditConnection(redirectUri?)`
Similar pattern but uses Reddit's OAuth flow.

#### `getConnection(platform: 'twitter' | 'reddit')`
Gets active connection from DB for executing actions (posting, reading timeline, etc).

---

## 6. SECURITY CHECKLIST

- [ ] **State Validation:** Every callback is verified against `auth_sessions.state`
- [ ] **Session Expiry:** auth_sessions expires in 15 minutes (prevent OAuth code reuse)
- [ ] **HTTPS Only:** Redirect URIs must be HTTPS in prod
- [ ] **User Auth Check:** All endpoints verify `getServerSession()` before proceeding
- [ ] **RLS Policies:** Supabase RLS prevents users from accessing others' connections
  ```sql
  CREATE POLICY "Users can view own composio connections" ON composio_connections
    FOR SELECT USING (auth.uid() = user_id);
  ```
- [ ] **Token Storage:** Never log or expose `composio_connection_id` in client responses
- [ ] **Revocation:** Attempt to revoke on Composio side before deleting locally
- [ ] **Rate Limiting:** Add rate limit to `/api/composio/auth/*` to prevent spam

---

## 7. ERROR HANDLING

### User denies OAuth permission
```
Twitter redirects with: ?error=access_denied&error_description=User%20denied
↓
Callback handler catches error param
↓
Redirects to /connections?error=OAuth%20failed:%20User%20denied
↓
Frontend displays red error banner
```

### Connection already exists
```
User tries to connect X twice
↓
Second OAuth callback finds existing composio_connections record
↓
Updates existing record instead of creating new
↓
Shows success (idempotent)
```

### Composio API fails
```
POST /auth/twitter fails
↓
Catch block logs error
↓
Return 500 with error message
↓
Frontend shows toast: "Failed to connect X"
↓
User can retry
```

---

## 8. FUTURE ENHANCEMENTS

### Short-term
1. **Account Verification:** After callback, fetch account details from Composio and show:
   - Verified badge ✓
   - Follower count
   - Account age
   - Profile picture

2. **Test Connection:** Before showing "Active", test posting a draft or reading account info

3. **Token Refresh:** Monitor token expiry and auto-refresh if supported

4. **Disconnect Confirmation:** Show "Are you sure?" with risk level (e.g., 5 scheduled posts pending)

### Medium-term
5. **Multi-Account Support:** Allow connecting multiple X accounts (personal + brand)

6. **Connection Status Monitoring:** Periodic health checks for token validity

7. **Audit Trail:** Log all connection/disconnection events per user

8. **Notifications:** Email user when connection succeeds/fails

### Long-term
9. **OAuth Revocation API:** Implement endpoint that fully revokes tokens on platform side

10. **Connection Expiry Alerts:** Warn users 7 days before token expiry

11. **Scopes UI:** Show user exactly what permissions Nexa is requesting before OAuth

---

## 9. TESTING STRATEGY

### Unit Tests
- [ ] `initiateTwitterConnection()` returns valid authUrl
- [ ] Invalid platform returns error
- [ ] auth_sessions created with correct state

### Integration Tests
- [ ] Full OAuth flow: click → redirect → callback → connection stored
- [ ] Duplicate connection updates instead of creating new
- [ ] State validation prevents CSRF

### E2E Tests (Playwright)
- [ ] User can connect X account
- [ ] Disconnected accounts disappear from list
- [ ] Error state handled gracefully

---

## 10. ENVIRONMENT VARIABLES

```bash
# Composio API
COMPOSIO_API_KEY=xxx

# OAuth Callback
NEXTAUTH_URL=https://localhost:3000  # Prod: https://nexa.ai
NEXTAUTH_SECRET=xxx

# Twitter/Reddit Apps (configured in Composio dashboard)
# No need to store here—Composio manages it with authConfigId
```

---

## 11. DEPLOYMENT CHECKLIST

- [ ] auth_sessions table exists with expiry cleanup job
- [ ] composio_connections RLS policies enforced
- [ ] NEXTAUTH_URL points to prod domain
- [ ] OAuth callback URL registered in Composio dashboard
- [ ] Composio API key set in production env
- [ ] Rate limiting enabled on `/api/composio/auth/*`
- [ ] Error handling tested for Composio API downtime
- [ ] Monitoring: Track OAuth success/failure rates

---

## 12. QUICK REFERENCE: COMPOSIO SETUP

### In Composio Dashboard
1. Create Twitter OAuth App integration
   - Get credentials from developer.twitter.com
   - Create authConfigId: `ac_vUASEFFIWuaE` ← use this in code
   - Set Redirect URI to `https://yourdomain.com/api/composio/callback`

2. Create Reddit OAuth App integration
   - Similar setup with Reddit app credentials

3. Test connection by visiting authUrl in browser

---

**Status:** ✅ Architecture complete and working  
**Last Updated:** Dec 21, 2025  
**Next Phase:** Implement token refresh and account verification
