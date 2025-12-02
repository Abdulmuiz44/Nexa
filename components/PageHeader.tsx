import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    badge?: string;
    title: string;
    description?: string;
    className?: string;
    children?: React.ReactNode;
}

export default function PageHeader({
    badge,
    title,
    description,
    className,
    children
}: PageHeaderProps) {
    return (
        <div className={cn("relative overflow-hidden py-20 sm:py-28", className)}>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
            <div className="pointer-events-none absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />

            <div className="container relative z-10 mx-auto px-4 text-center sm:px-6">
                {badge && (
                    <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-sm">
                        <span className="text-sm font-semibold text-primary">{badge}</span>
                    </div>
                )}

                <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
                    {title}
                </h1>

                {description && (
                    <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                        {description}
                    </p>
                )}

                {children && (
                    <div className="mt-8">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
