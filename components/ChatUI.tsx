"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Loader2, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { supabaseClient } from '@/lib/supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PostConfirmModal from '@/components/PostConfirmModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'action' | 'result';
}

export default function ChatUI({ conversationId }: { conversationId?: string }) {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [agentMode, setAgentMode] = useState<'manual' | 'autonomous' | 'review'>('manual');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Load conversation history (selected conversation or latest)
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (status !== 'authenticated' || !userId) {
        console.log('ChatUI: Not loading history - status:', status, 'userId:', userId);
        return;
      }

      if (!supabaseClient) {
        console.warn('ChatUI: Supabase not configured; showing welcome message.');
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm Nexa, your AI-powered social media assistant. I can help you with:\n\n• Content creation for Twitter/X and Reddit\n• Social media management and scheduling\n• Analytics and performance tracking\n• Campaign optimization\n• Community engagement\n\nWhat would you like me to help you with today?`,
          timestamp: new Date(),
          type: 'text'
        }]);
        setIsLoadingHistory(false);
        return;
      }

      console.log('ChatUI: Loading conversation history for user:', userId, 'conversationId:', conversationId);

      try {
        let targetConversationId = conversationId;

        if (!targetConversationId) {
          // Get the latest conversation via history API
          const response = await fetch('/api/chat/history?limit=1');
          if (response.ok) {
            const { conversations: historyData } = await response.json();
            targetConversationId = historyData?.[0]?.id;
          }
        }

        if (targetConversationId) {
          // Load messages via messages API
          const response = await fetch(`/api/chat/messages/${targetConversationId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch messages');
          }

          const { messages: messagesData } = await response.json();

          if (messagesData && messagesData.length > 0) {
            const loadedMessages: Message[] = messagesData.map((msg: any) => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              type: msg.metadata?.tool_calls > 0 ? 'action' : 'text',
            }));
            setMessages(loadedMessages);
          } else {
            // Show welcome message if no history
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: `Hello! I'm Nexa, your AI-powered social media assistant. I can help you with:\n\n• Content creation for Twitter/X and Reddit\n• Social media management and scheduling\n• Analytics and performance tracking\n• Campaign optimization\n• Community engagement\n\nWhat would you like me to help you with today?`,
              timestamp: new Date(),
              type: 'text'
            }]);
          }
        } else {
          // Show welcome message if no conversation
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm Nexa, your AI-powered social media assistant. I can help you with:\n\n• Content creation for Twitter/X and Reddit\n• Social media management and scheduling\n• Analytics and performance tracking\n• Campaign optimization\n• Community engagement\n\nWhat would you like me to help you with today?`,
            timestamp: new Date(),
            type: 'text'
          }]);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
        // Show welcome message on error
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm Nexa, your AI-powered social media assistant. I can help you with:\n\n• Content creation for Twitter/X and Reddit\n• Social media management and scheduling\n• Analytics and performance tracking\n• Campaign optimization\n• Community engagement\n\nWhat would you like me to help you with today?`,
          timestamp: new Date(),
          type: 'text'
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    setIsLoadingHistory(true);
    loadConversationHistory();
  }, [status, userId, conversationId]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: userId,
          agentMode,
          conversationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        let messageType: 'text' | 'action' | 'result' = 'text';
        let content = data.response || 'I received your message. How can I help you with your social media tasks?';

        // Check if the response contains action keywords or has actions
        if (data.actions && data.actions.length > 0) {
          messageType = 'action';
          // Add action results to the content
          const actionSummary = data.actions.map((action: any) =>
            `✓ ${action.name.replace('_', ' ').toUpperCase()}: ${action.result}`
          ).join('\n');
          content += '\n\n' + actionSummary;
        } else if (content.toLowerCase().includes('post') || content.toLowerCase().includes('create') || content.toLowerCase().includes('schedule')) {
          messageType = 'action';
        } else if (content.toLowerCase().includes('completed') || content.toLowerCase().includes('done') || content.toLowerCase().includes('result')) {
          messageType = 'result';
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
          type: messageType
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorData.error || 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered a network error. Please check your connection and try again.',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageBadgeColor = (type?: string) => {
    switch (type) {
      case 'action': return 'bg-blue-500';
      case 'result': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getMessageTypeLabel = (type?: string) => {
    switch (type) {
      case 'action': return 'Action';
      case 'result': return 'Result';
      default: return 'Message';
    }
  };

  // Show loading while session is being determined
  if (status === 'loading') {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (status === 'unauthenticated' || !userId) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Please log in to access the chat.</p>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="mx-auto flex h-full max-w-4xl flex-col">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <Bot className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
              Chat with Nexa
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mode:</span>
              <Select value={agentMode} onValueChange={(value: 'manual' | 'autonomous' | 'review') => setAgentMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="autonomous">Autonomous</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Your intelligent social media management companion powered by AI
          </p>
        </div>

        <Card className="flex flex-1 flex-col rounded-3xl border-border/60 bg-card/40 backdrop-blur">
          <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
            <ScrollArea className="flex-1 pr-2 sm:pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading conversation...</span>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      <div
                        className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                      >
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                            }`}
                        >
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`rounded-lg px-3 py-2 ${message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                            }`}
                        >
                          {message.type && message.type !== 'text' && (
                            <Badge
                              className={`mb-2 text-xs ${getMessageBadgeColor(message.type)}`}
                              variant="secondary"
                            >
                              {getMessageTypeLabel(message.type)}
                            </Badge>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-2 max-w-[80%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Nexa is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick action to confirm last AI message as a post */}
            {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
              <div className="flex justify-end">
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="text-xs text-primary underline"
                >
                  Use last AI message as a post
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Nexa to create content, manage campaigns, or analyze performance..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Send className="mr-2 hidden h-4 w-4 sm:inline" />
                <span className="text-sm font-semibold sm:hidden">Send</span>
                <span className="hidden sm:inline">Send</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post confirmation modal */}
      <PostConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        defaultPlatform={'twitter'}
        initialContent={(messages.findLast?.((m: any) => m.role === 'assistant')?.content) || messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || ''}
        onSuccess={() => {
          // Optionally show a toast
        }}
      />
    </div>
  );
}
