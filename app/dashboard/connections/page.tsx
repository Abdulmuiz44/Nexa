'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface Connection {
    id: string;
    platform: string;
    username: string;
    accountId: string;
    status: string;
    connectedAt: string;
    verified?: boolean;
    followerCount?: number;
    lastVerifiedAt?: string;
    isExpired?: boolean;
}

export default function ConnectionsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [disconnecting, setDisconnecting] = useState<string | null>(null);

    if (!session) {
        redirect('/login');
    }

    useEffect(() => {
        fetchConnections();

        // Handle query params from OAuth callback
        const errorMsg = searchParams.get('error');
        const successMsg = searchParams.get('success');

        if (errorMsg) {
            setError(decodeURIComponent(errorMsg));
            // Clear from URL
            router.replace('/dashboard/connections');
        }

        if (successMsg) {
            setSuccess(decodeURIComponent(successMsg));
            // Clear from URL
            router.replace('/dashboard/connections');
            // Auto-clear success after 5 seconds
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    const fetchConnections = async () => {
      try {
        setError(null);
        const res = await fetch('/api/composio/connections');
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        // Filter out any mock/test data - validate connections rigorously
        const realConnections = (data.connections || []).filter((conn: Connection) => {
          // Must have required fields
          if (!conn.accountId || !conn.username || !conn.id) {
            return false;
          }
          
          // Filter out mock/test/demo accounts
          const testPatterns = ['mock', 'test', 'demo', 'mock_', 'test_', 'demo_'];
          const lowerUsername = conn.username.toLowerCase();
          if (testPatterns.some(pattern => lowerUsername.includes(pattern))) {
            return false;
          }
          
          // Filter out empty or invalid IDs
          if (conn.id === '' || conn.accountId === '' || conn.username === '') {
            return false;
          }
          
          return true;
        });
        
        setConnections(realConnections);
        
        if (data.hasExpiredConnections) {
          setError('⚠️ Some connections may have expired. Please reconnect them.');
        }
      } catch (err) {
        console.error('Failed to fetch connections:', err);
        setError('Failed to load connections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const connectPlatform = async (
    platform: 'twitter' | 'reddit' | 'linkedin'
  ) => {
        setConnecting(platform);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(`/api/composio/auth/${platform}`, {
                method: 'POST',
            });

            if (!res.ok) {
                const data = await res.json();

                if (res.status === 409) {
                    setError(`${platform} is already connected. Disconnect it first to connect a different account.`);
                } else if (res.status === 501) {
                    setError(data.message || `${platform} integration is not yet available`);
                } else {
                    setError(data.details || data.message || `Failed to initiate ${platform} connection`);
                }
                return;
            }

            const data = await res.json();

            if (data.authUrl) {
                // Redirect to OAuth - this will navigate away and return via callback
                window.location.href = data.authUrl;
            } else {
                setError(`Failed to get authorization URL for ${platform}`);
            }
        } catch (err) {
            console.error('Connection error:', err);
            setError(`Network error: Failed to connect ${platform}. Please check your connection and try again.`);
        } finally {
            setConnecting(null);
        }
    };

    const disconnectPlatform = async (platform: string) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}? Scheduled posts on this platform will not be posted.`)) {
            return;
        }

        setDisconnecting(platform);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(
                `/api/composio/connections?platform=${platform}`,
                { method: 'DELETE' }
            );

            if (!res.ok) {
                const data = await res.json();
                setError(data.message || `Failed to disconnect ${platform}`);
                return;
            }

            const data = await res.json();

            if (data.success) {
                setSuccess(`${platform} disconnected successfully`);
                await fetchConnections();
                // Auto-clear success message
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.error || `Failed to disconnect ${platform}`);
            }
        } catch (err) {
            console.error('Disconnect error:', err);
            setError(`Network error: Failed to disconnect ${platform}`);
        } finally {
            setDisconnecting(null);
        }
    };

    const platforms = ['twitter', 'reddit', 'linkedin'];

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'twitter':
                return '𝕏';
            case 'reddit':
                return '🔴';
            case 'linkedin':
                return '💼';
            default:
                return '🔗';
        }
    };

    return (
        <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Social Media Connections</h1>
                        <p className="text-muted-foreground mt-2">
                            Connect your social media accounts to start posting and tracking engagement
                        </p>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-green-700 text-sm">{success}</p>
                        </div>
                        <button
                            onClick={() => setSuccess(null)}
                            className="text-green-600 hover:text-green-800 text-sm"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Connected Accounts Section */}
                {connections.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {connections.map((conn) => (
                                <Card key={conn.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                                                    {getPlatformIcon(conn.platform)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg capitalize">{conn.platform}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">@{conn.username}</p>
                                                </div>
                                            </div>
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Active
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-3">
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>Connected: {new Date(conn.connectedAt).toLocaleDateString()}</p>
                                            {conn.verified && <p className="text-blue-600">✓ Verified account</p>}
                                            {conn.isExpired && (
                                                <p className="text-yellow-600">⚠️ Connection expiring soon</p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => disconnectPlatform(conn.platform)}
                                            disabled={disconnecting === conn.platform}
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                        >
                                            {disconnecting === conn.platform ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Disconnecting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Disconnect
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your connections...</p>
                    </div>
                )}

                {/* Available Platforms Section */}
                {!loading && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">
                            {connections.length > 0 ? 'Connect More Accounts' : 'Connect Your First Account'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {platforms.map((platform) => {
                                const isConnected = connections.some((c) => c.platform === platform);
                                const isConnecting = connecting === platform;

                                return (
                                    <Card
                                        key={platform}
                                        className={`cursor-pointer transition-all hover:shadow-md ${isConnected ? 'opacity-50 pointer-events-none' : ''
                                            }`}
                                    >
                                        <button
                                            onClick={() =>
                                                connectPlatform(platform as 'twitter' | 'reddit' | 'linkedin')
                                            }
                                            disabled={isConnecting || isConnected}
                                            className="w-full h-full p-6 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="text-4xl">{getPlatformIcon(platform)}</div>
                                                <div>
                                                    <p className="font-semibold capitalize">
                                                        {platform === 'twitter'
                                                            ? 'X / Twitter'
                                                            : platform.charAt(0).toUpperCase() + platform.slice(1)}
                                                    </p>
                                                    {isConnecting && (
                                                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            Connecting...
                                                        </p>
                                                    )}
                                                    {isConnected && (
                                                        <p className="text-sm text-green-600 font-medium mt-1">
                                                            ✓ Connected
                                                        </p>
                                                    )}
                                                    {!isConnecting && !isConnected && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Click to connect
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && connections.length === 0 && (
                    <div className="text-center py-12">
                        <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Connect your social media accounts to start posting and tracking engagement
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
