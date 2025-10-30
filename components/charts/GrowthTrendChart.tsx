"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GrowthTrendChartProps {
  data: Array<{
    period: string;
    followers: number;
    engagement: number;
  }>;
  title?: string;
}

export default function GrowthTrendChart({ data, title = "Growth Trends" }: GrowthTrendChartProps) {
  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
                className="text-muted-foreground text-xs"
              />
              <YAxis className="text-muted-foreground text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar
                dataKey="followers"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Followers"
              />
              <Bar
                dataKey="engagement"
                fill="hsl(var(--accent))"
                radius={[4, 4, 0, 0]}
                name="Engagement"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
