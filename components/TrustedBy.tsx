import React from 'react';
import { Card } from './ui/card';
import { Users, TrendingUp, Award } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '500+',
    label: 'Active Users',
    detail: 'Founders & marketers growing with Nexa',
  },
  {
    icon: TrendingUp,
    value: '+287%',
    label: 'Avg. Growth',
    detail: 'In the first 90 days of using Nexa',
  },
  {
    icon: Award,
    value: '4.9/5',
    label: 'User Rating',
    detail: 'From 500+ verified reviews',
  },
];

const TrustedBy = () => {
  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <h3 className="mb-8 text-center text-base font-medium text-muted-foreground sm:mb-10 sm:text-lg">
          Trusted by founders, agencies, and growth teams worldwide
        </h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {stats.map((stat, idx) => {
            const IconComponent = stat.icon;
            return (
              <Card 
                key={idx}
                className="group rounded-2xl border-border bg-card/50 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-neon sm:p-8"
              >
                <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground sm:text-4xl">{stat.value}</p>
                <p className="text-sm font-semibold text-primary mt-2">{stat.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;