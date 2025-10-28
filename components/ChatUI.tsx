'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [connected, setConnected] = useState(false);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    fetchCredits();
    fetchConnected();
  }, []);

  const fetchConnected = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', session.user.id);

    setConnected(data && data.length > 0);
  };

  const fetchCredits = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('credits_wallet')
      .select('balance')
      .eq('user_id', session.user.id)
      .single();

    setCredits(data?.balance || 0);

    // Fetch forecast
    const { data: user } = await supabase
      .from('users')
      .select('credit_forecast')
      .eq('id', session.user.id)
      .single();

    setForecast(user?.credit_forecast);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (credits < 5) {
      alert('Insufficient credits. Please top up.');
      return;
    }

    setLoading(true);
    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input };
    setMessages([...messages, userMessage]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, conversationId }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      const aiMessage = { id: Date.now().toString(), role: 'assistant' as const, content: data.message };
      setMessages(prev => [...prev, aiMessage]);
      setConversationId(data.conversationId);
      fetchCredits(); // Update credits
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-100">
        Credits: {credits}
        {forecast?.risk_level === 'high' && (
          <div className="text-red-500 mt-2">
            ⚠️ Low on credits — depletion in {forecast.days_left} days.
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div>Loading...</div>}
      </div>
      <div className="p-4 border-t">
        {!connected && (
          <button onClick={() => window.location.href = '/dashboard/connections'} className="mb-2 bg-green-500 text-white p-2">
            Connect Accounts
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Chat with Nexa..."
          className="w-full p-2 border"
        />
        <button onClick={sendMessage} disabled={loading} className="mt-2 bg-blue-500 text-white p-2">
          Send
        </button>
      </div>
    </div>
  );
}
