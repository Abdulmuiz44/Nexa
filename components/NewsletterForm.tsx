'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NewsletterFormProps {
    className?: string;
}

export default function NewsletterForm({ className }: NewsletterFormProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            // TODO: Implement newsletter subscription API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSubscribed(true);
            toast.success('Successfully subscribed to newsletter!');
            setEmail('');
        } catch (error) {
            toast.error('Failed to subscribe. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (subscribed) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                <span>Thanks for subscribing!</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={className}>
            <div className="flex gap-2">
                <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                />
                <Button type="submit" disabled={loading} variant="hero">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Subscribe'
                    )}
                </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
                Get weekly tips on AI-powered social media growth. Unsubscribe anytime.
            </p>
        </form>
    );
}
