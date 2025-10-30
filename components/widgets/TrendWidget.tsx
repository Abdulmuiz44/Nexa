"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface TrendWidgetProps {
  title: string;
  value: string | number;
  data: Array<{
    value: number;
  }>;
  color?: string;
  description?: string;
}

export default function TrendWidget({
  title,
  value,
  data,
  color = "hsl(var(--primary))",
  description
}: TrendWidgetProps) {
  return (
    <Card className="p-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-2xl font-bold mb-2">{value}</div>

        <div className="h-16 w-full mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}
