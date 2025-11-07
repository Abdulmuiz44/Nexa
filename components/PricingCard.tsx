"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PricingCardProps {
  title: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  planId: string;
  highlighted?: boolean;
  onSelect?: (planId: string) => void;
  ctaHref?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ title, tagline, price, period, features, planId, highlighted, onSelect, ctaHref }) => {
  return (
    <Card className={cn('flex flex-col', highlighted ? 'border-primary' : '')}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <p className="text-muted-foreground">{tagline}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-6">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="p-6">
      {ctaHref ? (
        <Button className="w-full" variant={highlighted ? 'default' : 'outline'} asChild>
          <Link href={ctaHref}>Choose Plan</Link>
        </Button>
      ) : (
        <Button
          className="w-full"
          variant={highlighted ? 'default' : 'outline'}
          onClick={() => onSelect?.(planId)}
          disabled={!onSelect}
        >
          Choose Plan
        </Button>
      )}
      </div>
    </Card>
  );
};

export default PricingCard;
