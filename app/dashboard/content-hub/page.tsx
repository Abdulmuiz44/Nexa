'use client';

import React, { useState, useEffect } from 'react';
import { ContentGrid } from '@/components/dashboard/ContentGrid';
import { ContentForm } from '@/components/dashboard/ContentForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Database, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ContentHubItem } from '@/lib/services/contentHubService';

export default function ContentHubPage() {
    const [items, setItems] = useState<ContentHubItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/content-hub');
            const data = await response.json();
            if (Array.isArray(data)) {
                setItems(data);
            } else {
                console.error('Invalid response format:', data);
                toast.error(data.error || 'Failed to load content hub');
            }
        } catch (error) {
            toast.error('Failed to load content hub');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch(`/api/content-hub/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Delete failed');

            toast.success('Item deleted');
            setItems(items.filter((item: any) => item.id !== id));
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleSuccess = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        fetchItems();
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <div className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                        <Database className="h-8 w-8 text-primary" />
                        Content Hub
                    </h1>
                    <p className="text-muted-foreground">
                        Ingest and manage high-value content for your AI-driven campaigns.
                    </p>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Content
                </Button>
            </div>

            <div className="grid gap-6">
                <div className="flex items-center gap-2 rounded-lg border bg-primary/5 p-4 text-sm text-primary">
                    <Sparkles className="h-5 w-5 shrink-0" />
                    <p>
                        <strong>Mistral AI Tip:</strong> Every piece of content you ingest is automatically tagged and analyzed to improve your campaign suggestions and engagement potential.
                    </p>
                </div>

                {loading ? (
                    <div className="flex h-60 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ContentGrid
                        items={items}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                )}
            </div>

            <Dialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setEditingItem(null);
                }}
            >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Content' : 'Add New Content'}</DialogTitle>
                        <DialogDescription>
                            {editingItem
                                ? 'Update the content details and tags.'
                                : 'Paste a link or text to ingest it into your Content Hub.'}
                        </DialogDescription>
                    </DialogHeader>
                    <ContentForm
                        initialData={editingItem}
                        onSuccess={handleSuccess}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            </div>
        </div>
    );
}
