'use client';

import React, { useState } from 'react';
import { ContentCard } from './ContentCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface ContentGridProps {
    items: any[];
    onDelete: (id: string) => void;
    onEdit: (item: any) => void;
}

export const ContentGrid: React.FC<ContentGridProps> = ({ items, onDelete, onEdit }) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    if (!Array.isArray(items)) {
        return (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <p className="text-sm text-muted-foreground">Unable to load content items.</p>
            </div>
        );
    }

    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.raw_content.toLowerCase().includes(search.toLowerCase()) ||
            item.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()));

        const matchesType = typeFilter === 'all' || item.content_type === typeFilter;

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search titles, content, or tags..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="tweet">Tweets</SelectItem>
                            <SelectItem value="thread">Threads</SelectItem>
                            <SelectItem value="blog">Blogs</SelectItem>
                            <SelectItem value="video">Videos</SelectItem>
                            <SelectItem value="image">Images</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                    <p className="text-sm text-muted-foreground">No content items found matching your filters.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredItems.map((item) => (
                        <ContentCard
                            key={item.id}
                            item={item}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
