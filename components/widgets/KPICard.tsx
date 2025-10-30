import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
}

export default function KPICard({
  title,
  value,
  change,
  icon,
  description
}: KPICardProps) {
  const getChangeIcon = () => {
    if (!change) return null;

    switch (change.type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getChangeColor = () => {
    if (!change) return '';

    switch (change.type) {
      case 'increase':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'decrease':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">{title}</div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>

        <div className="text-3xl font-bold mb-2">{value}</div>

        <div className="flex items-center justify-between">
          {change && (
            <Badge variant="outline" className={`text-xs ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="ml-1">
                {change.type === 'increase' ? '+' : change.type === 'decrease' ? '-' : ''}
                {Math.abs(change.value)}%
              </span>
            </Badge>
          )}

          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
