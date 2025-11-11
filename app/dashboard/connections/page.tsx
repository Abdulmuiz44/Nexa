"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Twitter, MessageSquare, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Mark this page as dynamic
export const dynamic = 'force-dynamic';

function ConnectionsContent() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const searchParams = useSearchParams();
  const [redditConnected, setRedditConnected] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/composio/connections');
      if (!res.ok) {
        console.error('Failed to load connections:', res.status);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data?.connections) ? data.connections : [];
      setConnections(list);
      setTwitterConnected(list.some((c: any) => String(c.toolkit_slug).includes('twitter') && c.isActive !== false));
      setRedditConnected(list.some((c: any) => String(c.toolkit_slug).includes('reddit') && c.isActive !== false));
      
      console.log('Loaded connections:', {
        count: list.length,
        twitter: twitterConnected,
        reddit: redditConnected
      });
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadConnections();

    // Check for connection status from URL params
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      setMessage({
        type: 'success',
        text: `Successfully connected to ${connected}! Your account is now linked and ready to use.`
      });
      // Clear the message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } else if (error) {
      setMessage({
        type: 'error',
        text: `Connection failed: ${error}. Please try again or contact support if the issue persists.`
      });
      setTimeout(() => setMessage(null), 5000);
    }
  }, [userId, searchParams]);

  const connectToolkit = async (toolkit: string) => {
    if (!userId) {
      setMessage({ type: 'error', text: 'Please log in to connect your accounts' });
      return;
    }
    
    setBusy(true);
    setMessage({ type: 'success', text: `Initiating ${toolkit} connection... You'll be redirected to authorize.` });
    
    try {
      // Direct browser redirect to start OAuth flow
      window.location.href = `/api/composio/start-auth?toolkit=${encodeURIComponent(toolkit)}`;
    } catch (e) {
      console.error('Connect failed', e);
      setMessage({ type: 'error', text: `Failed to connect to ${toolkit}. Please try again.` });
      setBusy(false);
    }
  };

  const disconnect = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/composio/disconnect', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id }) 
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Account disconnected successfully' });
        await loadConnections();
      } else {
        setMessage({ type: 'error', text: 'Failed to disconnect account' });
      }
    } catch (e) {
      console.error('Disconnect failed', e);
      setMessage({ type: 'error', text: 'Failed to disconnect account' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts to enable automated posting and AI-powered management
          </p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Twitter/X Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Twitter className="h-5 w-5 text-white" />
                </div>
                Twitter / X
              </CardTitle>
            </CardHeader>
            <CardContent>
              {twitterConnected ? (
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Connected</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Not Connected</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-4">
                {twitterConnected 
                  ? 'Your Twitter/X account is connected. You can now auto-post, schedule tweets, and let AI engage with your audience.' 
                  : 'Connect your Twitter/X account to enable automated posting, engagement, and AI-powered content management.'}
              </p>
              <div className="flex gap-2">
                {twitterConnected ? (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => {
                    const c = connections.find((c: any) => String(c.toolkit_slug).includes('twitter'));
                    if (c) disconnect(c.id);
                  }}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="default" size="sm" disabled={busy || !userId} onClick={() => connectToolkit('twitter')}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Connect Twitter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reddit Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                Reddit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {redditConnected ? (
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Connected</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">Not Connected</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-4">
                {redditConnected 
                  ? 'Your Reddit account is connected. Post to subreddits and manage your Reddit presence automatically.' 
                  : 'Connect your Reddit account to enable automated posting to subreddits, commenting, and community engagement.'}
              </p>
              <div className="flex gap-2">
                {redditConnected ? (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => {
                    const c = connections.find((c: any) => String(c.toolkit_slug).includes('reddit'));
                    if (c) disconnect(c.id);
                  }}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="default" size="sm" disabled={busy || !userId} onClick={() => connectToolkit('reddit')}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Connect Reddit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">in</span>
                </div>
                LinkedIn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                LinkedIn integration is currently in development and will be available soon.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Instagram Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IG</span>
                </div>
                Instagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Instagram API integration is planned for future updates.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status Summary */}
        <Card className="mt-8 p-6">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {(twitterConnected ? 1 : 0) + (redditConnected ? 1 : 0)}
                </div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500 mb-1">
                  {busy ? 1 : 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 mb-1">2</div>
                <div className="text-sm text-muted-foreground">Coming Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500 mb-1">4</div>
                <div className="text-sm text-muted-foreground">Total Platforms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        {!twitterConnected && !redditConnected && (
          <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-0">
              <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
              <p className="text-sm text-blue-800">
                Connect your first social media account to unlock AI-powered automation. Once connected, you'll be able to:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                <li>Auto-post content to your connected accounts</li>
                <li>Schedule tweets and posts in advance</li>
                <li>Let AI analyze your posting patterns and style</li>
                <li>Auto-engage with relevant content (likes, retweets, replies)</li>
                <li>Chat with Nexa to manage all your social media activities</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ConnectionsContent />
    </Suspense>
  );
}
