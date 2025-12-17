'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ContentFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export const ContentForm: React.FC<ContentFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        raw_content: initialData?.raw_content || '',
        content_type: initialData?.content_type || 'other',
        source_url: initialData?.source_url || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.raw_content) {
            toast.error('Content is required');
            return;
        }

        setLoading(true);
        try {
            const url = initialData
                ? `/api/content-hub/${initialData.id}`
                : '/api/content-hub';

            const method = initialData ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to save content');

            toast.success(initialData ? 'Content updated' : 'Content added to hub');
            onSuccess();
        } catch (error) {
            toast.error('Something went wrong');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    placeholder="e.g., Q4 Growth Strategy"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                        value={formData.content_type}
                        onValueChange={(val) => setFormData({ ...formData, content_type: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tweet">Tweet</SelectItem>
                            <SelectItem value="thread">Thread</SelectItem>
                            <SelectItem value="blog">Blog Post</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="source_url">Source URL (Optional)</Label>
                    <Input
                        id="source_url"
                        type="url"
                        placeholder="https://..."
                        value={formData.source_url}
                        onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                    id="content"
                    placeholder="Paste your content here..."
                    className="min-h-[150px]"
                    value={formData.raw_content}
                    onChange={(e) => setFormData({ ...formData, raw_content: e.target.value })}
                />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Update Item' : 'Ingest Content'}
                </Button>
            </div>
        </form>
    );
};
