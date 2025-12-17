'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, ExternalLink, Trash2, Edit, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ContentHubItem {
    id: string;
    title: string;
    raw_content: string;
    content_type: string;
    source_url?: string;
    tags: string[];
    summary?: string;
    engagement_potential: number;
    status: string;
    created_at: string;
}

interface ContentCardProps {
    item: ContentHubItem;
    onDelete: (id: string) => void;
    onEdit: (item: ContentHubItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, onDelete, onEdit }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <Card className="group relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                        {item.content_type}
                    </Badge>
                    {item.status === 'draft' && (
                        <Badge variant="outline" className="text-muted-foreground">
                            Processing...
                        </Badge>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {item.source_url && (
                            <DropdownMenuItem onClick={() => window.open(item.source_url, '_blank')}>
                                <ExternalLink className="mr-2 h-4 w-4" /> View Source
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
                <CardTitle className="line-clamp-1 text-lg">{item.title}</CardTitle>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.summary || item.raw_content}
                </p>
                <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-medium text-primary/70">
                            #{tag.replace(/\s+/g, '')}
                        </span>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-0">
                <div className="flex items-center text-[10px] text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </div>
                <div className={cn(
                    "flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                    getScoreColor(item.engagement_potential)
                )}>
                    Potential: {item.engagement_potential}%
                </div>
            </CardFooter>
        </Card>
    );
};
