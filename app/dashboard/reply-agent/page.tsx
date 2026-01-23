'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
    Loader2,
    Plus,
    Trash2,
    Check,
    X,
    Edit3,
    Send,
    Search,
    Hash,
    AtSign,
    MessageCircle,
    Bot
} from 'lucide-react';

interface Interest {
    id: string;
    keyword: string | null;
    hashtag: string | null;
    account_to_monitor: string | null;
    is_active: boolean;
    auto_engage_type: string;
    max_replies_per_hour: number;
    created_at: string;
}

interface Reply {
    id: string;
    source_tweet_content: string;
    source_author_username: string;
    generated_reply: string;
    status: string;
    ai_confidence: number;
    created_at: string;
    twitter_interests?: {
        keyword: string | null;
        hashtag: string | null;
    };
}

export default function ReplyAgentPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [interests, setInterests] = useState<Interest[]>([]);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyword, setNewKeyword] = useState('');
    const [addingInterest, setAddingInterest] = useState(false);
    const [editingReply, setEditingReply] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [testTweet, setTestTweet] = useState('');
    const [generatingReply, setGeneratingReply] = useState(false);

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [sessionStatus, router]);

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            fetchInterests();
            fetchReplies();
        }
    }, [sessionStatus]);

    const fetchInterests = async () => {
        try {
            const res = await fetch('/api/agent/interests');
            if (res.ok) {
                const data = await res.json();
                setInterests(data.interests || []);
            }
        } catch (error) {
            console.error('Failed to fetch interests:', error);
        }
    };

    const fetchReplies = async () => {
        try {
            const res = await fetch('/api/agent/replies?status=pending');
            if (res.ok) {
                const data = await res.json();
                setReplies(data.replies || []);
            }
        } catch (error) {
            console.error('Failed to fetch replies:', error);
        } finally {
            setLoading(false);
        }
    };

    const addInterest = async () => {
        if (!newKeyword.trim()) return;

        setAddingInterest(true);
        try {
            const isHashtag = newKeyword.startsWith('#');
            const isAccount = newKeyword.startsWith('@');

            const res = await fetch('/api/agent/interests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: !isHashtag && !isAccount ? newKeyword.trim() : null,
                    hashtag: isHashtag ? newKeyword.trim() : null,
                    account_to_monitor: isAccount ? newKeyword.replace('@', '').trim() : null,
                }),
            });

            if (res.ok) {
                toast({ title: 'Interest added', description: `Now monitoring "${newKeyword}"` });
                setNewKeyword('');
                fetchInterests();
            } else {
                toast({ title: 'Error', description: 'Failed to add interest', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add interest', variant: 'destructive' });
        } finally {
            setAddingInterest(false);
        }
    };

    const deleteInterest = async (id: string) => {
        try {
            const res = await fetch(`/api/agent/interests?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Interest removed' });
                fetchInterests();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to remove interest', variant: 'destructive' });
        }
    };

    const handleReplyAction = async (id: string, action: 'approve' | 'reject', editedReply?: string) => {
        try {
            const res = await fetch('/api/agent/replies', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    action: editedReply ? 'edit' : action,
                    edited_reply: editedReply,
                }),
            });

            if (res.ok) {
                toast({
                    title: action === 'approve' ? 'Reply approved!' : 'Reply rejected',
                    description: action === 'approve' ? 'The reply will be posted shortly' : 'The reply has been discarded'
                });
                setEditingReply(null);
                fetchReplies();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update reply', variant: 'destructive' });
        }
    };

    const generateTestReply = async () => {
        if (!testTweet.trim()) return;

        setGeneratingReply(true);
        try {
            const res = await fetch('/api/agent/replies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tweet_content: testTweet,
                    author_username: 'test_user',
                }),
            });

            if (res.ok) {
                toast({ title: 'Reply generated!', description: 'Check the queue below' });
                setTestTweet('');
                fetchReplies();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to generate reply', variant: 'destructive' });
        } finally {
            setGeneratingReply(false);
        }
    };

    if (sessionStatus === 'loading' || loading) {
        return (
            <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bot className="h-8 w-8 text-blue-500" />
                        Reply Agent
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Automatically discover tweets and generate AI-powered replies
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Interests Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Monitoring Interests
                            </CardTitle>
                            <CardDescription>
                                Add keywords, #hashtags, or @accounts to monitor
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., AI coding, #react, @elonmusk"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                                />
                                <Button onClick={addInterest} disabled={addingInterest || !newKeyword.trim()}>
                                    {addingInterest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {interests.length === 0 ? (
                                    <p className="text-sm text-gray-500 py-4 text-center">
                                        No interests yet. Add keywords to start monitoring.
                                    </p>
                                ) : (
                                    interests.map((interest) => (
                                        <div
                                            key={interest.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                {interest.hashtag ? (
                                                    <Hash className="h-4 w-4 text-blue-500" />
                                                ) : interest.account_to_monitor ? (
                                                    <AtSign className="h-4 w-4 text-purple-500" />
                                                ) : (
                                                    <Search className="h-4 w-4 text-gray-500" />
                                                )}
                                                <span className="font-medium">
                                                    {interest.keyword || interest.hashtag || `@${interest.account_to_monitor}`}
                                                </span>
                                                <Badge variant={interest.is_active ? 'default' : 'secondary'} className="text-xs">
                                                    {interest.is_active ? 'Active' : 'Paused'}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteInterest(interest.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test Reply Generator */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Test Reply Generator
                            </CardTitle>
                            <CardDescription>
                                Paste a tweet to generate an AI reply
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Paste tweet content here to test AI reply generation..."
                                value={testTweet}
                                onChange={(e) => setTestTweet(e.target.value)}
                                rows={4}
                            />
                            <Button
                                onClick={generateTestReply}
                                disabled={generatingReply || !testTweet.trim()}
                                className="w-full"
                            >
                                {generatingReply ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Bot className="h-4 w-4 mr-2" />
                                        Generate Reply
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Reply Queue */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Replies ({replies.length})</CardTitle>
                        <CardDescription>
                            Review and approve AI-generated replies before posting
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {replies.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No pending replies</p>
                                <p className="text-sm">Generate a test reply above or wait for discovered tweets</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {replies.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3"
                                    >
                                        {/* Original Tweet */}
                                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-blue-500">@{reply.source_author_username}</span>
                                                {reply.twitter_interests?.keyword && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {reply.twitter_interests.keyword}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm">{reply.source_tweet_content}</p>
                                        </div>

                                        {/* AI Reply */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Bot className="h-4 w-4 text-purple-500" />
                                                <span className="text-sm font-medium">AI-Generated Reply</span>
                                                {reply.ai_confidence && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {Math.round(reply.ai_confidence * 100)}% confident
                                                    </Badge>
                                                )}
                                            </div>

                                            {editingReply === reply.id ? (
                                                <Textarea
                                                    value={editedContent}
                                                    onChange={(e) => setEditedContent(e.target.value)}
                                                    rows={3}
                                                />
                                            ) : (
                                                <p className="text-sm bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                                    {reply.generated_reply}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            {editingReply === reply.id ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleReplyAction(reply.id, 'approve', editedContent)}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Save & Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingReply(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleReplyAction(reply.id, 'approve')}
                                                    >
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setEditingReply(reply.id);
                                                            setEditedContent(reply.generated_reply);
                                                        }}
                                                    >
                                                        <Edit3 className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReplyAction(reply.id, 'reject')}
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
