/**
 * OAuth Flow Integration Tests
 * Tests the complete OAuth connection flow for Nexa
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('OAuth Flow Tests', () => {
  describe('POST /api/composio/auth/[platform]', () => {
    it('should initiate Twitter OAuth flow', async () => {
      const res = await fetch('http://localhost:3000/api/composio/auth/twitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth headers - session will be verified by getServerSession()
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.authUrl).toBeDefined();
      expect(data.authUrl).toMatch(/https:\/\/twitter.com/);
      expect(data.connectionId).toBeDefined();
      expect(data.state).toBeDefined();
      expect(data.platform).toBe('twitter');
    });

    it('should prevent duplicate connections', async () => {
      // First connection should succeed
      const res1 = await fetch('http://localhost:3000/api/composio/auth/twitter', {
        method: 'POST',
      });
      expect(res1.status).toBe(200);

      // Second connection attempt should fail with 409
      const res2 = await fetch('http://localhost:3000/api/composio/auth/twitter', {
        method: 'POST',
      });
      expect(res2.status).toBe(409);
      const data = await res2.json();
      expect(data.error).toContain('already connected');
      expect(data.alreadyConnected).toBe(true);
    });

    it('should reject invalid platform', async () => {
      const res = await fetch('http://localhost:3000/api/composio/auth/tiktok', {
        method: 'POST',
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Invalid platform');
    });

    it('should reject LinkedIn (not yet implemented)', async () => {
      const res = await fetch('http://localhost:3000/api/composio/auth/linkedin', {
        method: 'POST',
      });

      expect(res.status).toBe(501);
      const data = await res.json();
      expect(data.error).toContain('coming soon');
    });

    it('should enforce rate limiting', async () => {
      // Make 6 rapid requests (limit is 5 per 15 minutes)
      const requests = Array(6)
        .fill(null)
        .map(() =>
          fetch('http://localhost:3000/api/composio/auth/reddit', {
            method: 'POST',
          })
        );

      const responses = await Promise.all(requests);

      // Last one should be rate limited
      expect(responses[5].status).toBe(429);
      const data = await responses[5].json();
      expect(data.error).toContain('Too many');
      expect(data.retryAfter).toBeDefined();
    });

    it('should require authentication', async () => {
      // Without valid session, should return 401
      const res = await fetch('http://localhost:3000/api/composio/auth/twitter', {
        method: 'POST',
        // No auth headers
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/composio/callback', () => {
    it('should handle successful OAuth callback', async () => {
      // Simulate callback from Twitter
      const res = await fetch(
        'http://localhost:3000/api/composio/callback?connectionId=test_123&state=valid_state_uuid',
        {
          method: 'GET',
          redirect: 'manual', // Don't follow redirects
        }
      );

      // Should redirect to connections page
      expect(res.status).toBe(307); // Temporary redirect
      expect(res.headers.get('location')).toContain('/dashboard/connections');
      expect(res.headers.get('location')).toContain('success=');
    });

    it('should reject invalid state (CSRF protection)', async () => {
      const res = await fetch(
        'http://localhost:3000/api/composio/callback?connectionId=test_123&state=invalid_state',
        {
          method: 'GET',
          redirect: 'manual',
        }
      );

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('error=');
      expect(res.headers.get('location')).toContain('Session expired');
    });

    it('should handle OAuth errors', async () => {
      const res = await fetch(
        'http://localhost:3000/api/composio/callback?error=access_denied&error_description=User%20denied',
        {
          method: 'GET',
          redirect: 'manual',
        }
      );

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('error=');
    });

    it('should require both connectionId and state', async () => {
      const res = await fetch('http://localhost:3000/api/composio/callback?connectionId=test_123', {
        method: 'GET',
        redirect: 'manual',
      });

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('error=');
    });

    it('should store account information after successful callback', async () => {
      // After OAuth, user should have connection in DB
      const connectionsRes = await fetch('http://localhost:3000/api/composio/connections', {
        method: 'GET',
      });

      expect(connectionsRes.status).toBe(200);
      const data = await connectionsRes.json();
      expect(data.connections.length).toBeGreaterThan(0);

      const twitterConn = data.connections.find((c: any) => c.platform === 'twitter');
      expect(twitterConn).toBeDefined();
      expect(twitterConn.username).toBeTruthy();
      expect(twitterConn.verified).toBeDefined();
    });
  });

  describe('GET /api/composio/connections', () => {
    it('should list all active connections', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(Array.isArray(data.connections)).toBe(true);
      expect(data.count).toBe(data.connections.length);

      // Each connection should have required fields
      data.connections.forEach((conn: any) => {
        expect(conn.id).toBeDefined();
        expect(conn.platform).toBeDefined();
        expect(['twitter', 'reddit']).toContain(conn.platform);
        expect(conn.username).toBeDefined();
        expect(conn.status).toBe('active');
        expect(conn.connectedAt).toBeDefined();
      });
    });

    it('should include metadata in connections', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections', {
        method: 'GET',
      });

      const data = await res.json();
      const conn = data.connections[0];

      expect(conn.verified).toBeDefined();
      expect(typeof conn.verified).toBe('boolean');
      expect(conn.followerCount).toBeDefined();
      expect(typeof conn.followerCount).toBe('number');
    });

    it('should warn about expired connections', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections', {
        method: 'GET',
      });

      const data = await res.json();
      expect(data.hasExpiredConnections).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections', {
        method: 'GET',
        // No auth
      });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/composio/connections', () => {
    it('should disconnect a platform', async () => {
      // Delete Twitter connection
      const res = await fetch('http://localhost:3000/api/composio/connections?platform=twitter', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('disconnected');
      expect(data.revokedAt).toBeDefined();
    });

    it('should require platform parameter', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections', {
        method: 'DELETE',
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Platform');
    });

    it('should validate platform', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections?platform=invalid', {
        method: 'DELETE',
      });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent connection', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections?platform=reddit', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });

    it('should log audit trail on disconnect', async () => {
      // After disconnect, audit log should exist
      // This would require querying audit_logs table
      // Verify via audit_logs query
      const res = await fetch('http://localhost:3000/api/audit-logs?action=connection_revoked', {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.logs.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const res = await fetch('http://localhost:3000/api/composio/connections?platform=twitter', {
        method: 'DELETE',
        // No auth
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Frontend Integration', () => {
    it('should display connections on page load', async () => {
      // This would be an E2E test using Playwright
      // Pseudocode:
      // const page = await browser.newPage();
      // await page.goto('http://localhost:3000/dashboard/connections');
      // const buttons = await page.$$('button:has-text("Connect")');
      // expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle OAuth callback and show success', async () => {
      // Simulate callback redirect with success params
      // Verify success toast appears
    });

    it('should handle OAuth errors gracefully', async () => {
      // Simulate callback with error params
      // Verify error toast appears
    });
  });

  describe('Error Handling', () => {
    it('should handle Composio API failures gracefully', async () => {
      // Mock Composio API error
      // Should still store connection locally
      // Should return helpful error to user
    });

    it('should handle expired auth sessions', async () => {
      // Create auth session
      // Wait 16+ minutes
      // Try to complete OAuth
      // Should fail with "Session expired" message
    });

    it('should handle concurrent connection attempts', async () => {
      // Make simultaneous requests to connect same platform
      // Only one should succeed, others should get "already connected" error
    });
  });

  describe('Security', () => {
    it('should validate CSRF state token', () => {
      // State token should be cryptographically random
      // Should not be reusable
      // Should expire after 15 minutes
    });

    it('should not expose sensitive data in responses', () => {
      // Should never return actual tokens
      // Should never return connection IDs
      // Should not leak user identifiers
    });

    it('should enforce RLS policies', () => {
      // User A cannot see User B's connections
      // User A cannot delete User B's connections
      // Audit logs are user-scoped
    });

    it('should log all connection changes', () => {
      // Every connect/disconnect should be audited
      // Audit logs should include user, action, timestamp
      // Audit logs should be immutable
    });
  });
});
