"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, MessageSquare, Calendar, Search, Loader2 } from 'lucide-react';

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
}

export default function ChatHistoryUI() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const userId = (session?.user as any)?.id;

  useEffect(() => {
    const loadConversations = async () => {
      if (status !== 'authenticated' || !userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/chat/history?limit=100');
        if (response.ok) {
          const { conversations: data } = await response.json();
          setConversations(data || []);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    loadConversations();
  }, [status, userId]);

  const handleDelete = async (conversationId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    setDeleting(conversationId);
    try {
      const response = await fetch(`/api/chat/history/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
      } else {
        alert('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Error deleting conversation');
    } finally {
      setDeleting(null);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const date = new Date(c.created_at).toLocaleString();
    return date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.last_message && c.last_message.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Chat History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your previous conversations with Nexa
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search conversations by date or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
            />
          </div>
        </div>

        {/* Empty state */}
        {filteredConversations.length === 0 && searchTerm === '' && (
          <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start chatting with Nexa to begin building your conversation history
            </p>
            <Link href="/chat">
              <Button className="bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600">
                Start New Chat
              </Button>
            </Link>
          </div>
        )}

        {/* No search results */}
        {filteredConversations.length === 0 && searchTerm !== '' && (
          <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try searching with different keywords
            </p>
          </div>
        )}

        {/* Conversations list */}
        {filteredConversations.length > 0 && (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => {
              const date = new Date(conversation.created_at);
              const formattedDate = date.toLocaleDateString();
              const formattedTime = date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Link key={conversation.id} href={`/chat/history/${conversation.id}`}>
                  <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {formattedDate} at {formattedTime}
                            </span>
                          </div>
                          {conversation.last_message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {conversation.last_message}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(conversation.id);
                        }}
                        disabled={deleting === conversation.id}
                        className="ml-4 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                        title="Delete conversation"
                      >
                        {deleting === conversation.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {conversation.message_count && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {conversation.message_count} messages
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
