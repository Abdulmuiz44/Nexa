'use client';

import { useState } from 'react';

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(false);

  const connectPlatform = async (platform: string) => {
    setLoading(true);
    const res = await fetch('/api/composio/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      window.location.href = data.url;
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Connect Accounts</h1>
      <button onClick={() => connectPlatform('twitter')} disabled={loading} className="bg-blue-500 text-white p-2 mr-4">
        Connect Twitter
      </button>
      <button onClick={() => connectPlatform('reddit')} disabled={loading} className="bg-orange-500 text-white p-2">
        Connect Reddit
      </button>
    </div>
  );
}
