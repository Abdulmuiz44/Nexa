'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface Connection {
  id: string;
  platform: string;
  username: string;
  status: string;
  connectedAt: string;
}

export default function ConnectionsPage() {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    redirect('/login');
  }

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setError(null);
      const res = await fetch('/api/composio/connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (platform: 'twitter' | 'reddit' | 'linkedin') => {
    setConnecting(platform);
    setError(null);
    try {
      const res = await fetch(`/api/composio/auth/${platform}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.authUrl) {
        // Redirect to OAuth
        window.location.href = data.authUrl;
      } else {
        setError(`Failed to initiate ${platform} connection`);
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(`Failed to connect ${platform}`);
    } finally {
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      setError(null);
      const res = await fetch(
        `/api/composio/connections?platform=${platform}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (data.success) {
        await fetchConnections();
        alert(`Successfully disconnected from ${platform}`);
      } else {
        setError(data.error || 'Failed to disconnect');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError('Failed to disconnect account');
    }
  };

  const platforms = ['twitter', 'reddit', 'linkedin'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social Media Connections</h1>
          <p className="mt-2 text-gray-600">
            Connect your social media accounts to start posting and tracking engagement
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Connected Accounts Section */}
        {connections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h2>
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-600">
                          {conn.platform.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">{conn.platform}</p>
                        <p className="text-sm text-gray-600">@{conn.username}</p>
                        <p className="text-xs text-gray-500">
                          Connected {new Date(conn.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                      ✓ Active
                    </span>
                    <button
                      onClick={() => disconnectPlatform(conn.platform)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Platforms Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {connections.length > 0 ? 'Connect More Accounts' : 'Connect Your First Account'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const isConnected = connections.some((c) => c.platform === platform);
              const isConnecting = connecting === platform;

              return (
                <button
                  key={platform}
                  onClick={() => connectPlatform(platform as 'twitter' | 'reddit' | 'linkedin')}
                  disabled={isConnecting || isConnected}
                  className={`relative p-6 rounded-lg font-semibold text-lg transition transform hover:scale-105 ${
                    isConnected
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isConnecting
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">
                      {platform === 'twitter' && '𝕏'}
                      {platform === 'reddit' && '🔴'}
                      {platform === 'linkedin' && '💼'}
                    </span>
                    <span>
                      {isConnecting ? 'Connecting...' : ''}
                      {!isConnecting && `${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
                      {isConnected && ' ✓'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading your connections...</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Once connected, you can post content, schedule posts, and track engagement across all your platforms from the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
