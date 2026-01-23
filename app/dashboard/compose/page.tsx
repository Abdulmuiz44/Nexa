'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
    Send,
    Clock,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Twitter,
    Link2
} from 'lucide-react';

interface Connection {
    id: string;
    platform: string;
    username: string;
    isExpired: boolean;
}

const TWITTER_CHAR_LIMIT = 280;

export default function ComposePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [content, setContent] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'reddit'>('twitter');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [scheduling, setScheduling] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login');
        }
    }, [status, router]);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/connectors');
            if (res.ok) {
                const data = await res.json();
                setConnections(data.connections || []);
            }
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const isConnected = (platform: string) => {
        return connections.some(c => c.platform === platform && !c.isExpired);
    };

    const getConnection = (platform: string) => {
        return connections.find(c => c.platform === platform);
    };

    const charCount = content.length;
    const isOverLimit = selectedPlatform === 'twitter' && charCount > TWITTER_CHAR_LIMIT;
    const charRemaining = TWITTER_CHAR_LIMIT - charCount;

    const handlePostNow = async () => {
        if (!content.trim()) {
            toast({ title: 'Error', description: 'Please enter content to post', variant: 'destructive' });
            return;
        }

        if (isOverLimit) {
            toast({ title: 'Error', description: 'Content exceeds character limit', variant: 'destructive' });
            return;
        }

        if (!isConnected(selectedPlatform)) {
            toast({ title: 'Error', description: `Please connect your ${selectedPlatform} account first`, variant: 'destructive' });
            return;
        }

        setPosting(true);
        try {
            const res = await fetch('/api/posts/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    content: content.trim(),
                    scheduled_at: new Date().toISOString(), // Immediate
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to post');
            }

            toast({ title: 'Success!', description: 'Your post has been queued for immediate publishing!' });
            setContent('');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setPosting(false);
        }
    };

    const handleSchedule = async () => {
        if (!content.trim()) {
            toast({ title: 'Error', description: 'Please enter content to post', variant: 'destructive' });
            return;
        }

        if (isOverLimit) {
            toast({ title: 'Error', description: 'Content exceeds character limit', variant: 'destructive' });
            return;
        }

        if (!scheduledAt) {
            toast({ title: 'Error', description: 'Please select a date and time', variant: 'destructive' });
            return;
        }

        const scheduleDate = new Date(scheduledAt);
        if (scheduleDate <= new Date()) {
            toast({ title: 'Error', description: 'Scheduled time must be in the future', variant: 'destructive' });
            return;
        }

        if (!isConnected(selectedPlatform)) {
            toast({ title: 'Error', description: `Please connect your ${selectedPlatform} account first`, variant: 'destructive' });
            return;
        }

        setScheduling(true);
        try {
            const res = await fetch('/api/posts/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    content: content.trim(),
                    scheduled_at: scheduleDate.toISOString(),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to schedule');
            }

            toast({
                title: 'Scheduled!',
                description: `Your post will be published on ${scheduleDate.toLocaleString()}`
            });
            setContent('');
            setScheduledAt('');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setScheduling(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const twitterConnection = getConnection('twitter');

    return (
        <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Compose Post</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Create and schedule posts for your social media accounts
                    </p>
                </div>

                {/* Connection Status */}
                {!isConnected('twitter') && (
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                                Connect your Twitter account to start posting
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/dashboard/connections')}
                            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                        >
                            <Link2 className="h-4 w-4 mr-2" />
                            Connect
                        </Button>
                    </div>
                )}

                {/* Connected Account */}
                {twitterConnection && !twitterConnection.isExpired && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-green-700 dark:text-green-300 text-sm">
                                Posting as <strong>@{twitterConnection.username}</strong>
                            </p>
                        </div>
                        <Badge variant="outline" className="border-green-600 text-green-700 dark:text-green-300">
                            <Twitter className="h-3 w-3 mr-1" />
                            Connected
                        </Badge>
                    </div>
                )}

                {/* Composer Card */}
                <Card className="border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Twitter className="h-5 w-5 text-blue-500" />
                            New Tweet
                        </CardTitle>
                        <CardDescription>
                            Compose your tweet below. Maximum {TWITTER_CHAR_LIMIT} characters.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Text Area */}
                        <div className="space-y-2">
                            <Textarea
                                placeholder="What's happening?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={`min-h-[150px] text-lg resize-none ${isOverLimit ? 'border-red-500 focus:border-red-500' : ''}`}
                            />
                            <div className="flex justify-between items-center text-sm">
                                <span className={`${isOverLimit ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                    {charRemaining < 0 ? charRemaining : `${charCount}/${TWITTER_CHAR_LIMIT}`}
                                </span>
                                {isOverLimit && (
                                    <span className="text-red-500">
                                        {Math.abs(charRemaining)} characters over limit
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Schedule Picker */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="h-4 w-4" />
                                <span>Schedule for later (optional)</span>
                            </div>
                            <Input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="max-w-xs"
                            />
                            {scheduledAt && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Will post on: {new Date(scheduledAt).toLocaleString()}
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            {scheduledAt ? (
                                <Button
                                    onClick={handleSchedule}
                                    disabled={scheduling || !content.trim() || isOverLimit || !isConnected('twitter')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {scheduling ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Scheduling...
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="h-4 w-4 mr-2" />
                                            Schedule Post
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handlePostNow}
                                    disabled={posting || !content.trim() || isOverLimit || !isConnected('twitter')}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {posting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Post Now
                                        </>
                                    )}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard/scheduled')}
                            >
                                View Scheduled
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Tips */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <h3 className="font-medium mb-2">💡 Tips for better engagement</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Keep tweets concise and engaging</li>
                        <li>• Use hashtags sparingly (1-2 max)</li>
                        <li>• Best posting times: 8-10 AM & 6-9 PM</li>
                        <li>• Ask questions to encourage replies</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
