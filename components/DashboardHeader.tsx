"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Filter } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showTimeframeSelector?: boolean;
  timeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  showExportButton?: boolean;
  onExport?: () => void;
  stats?: {
    total: number;
    change?: number;
    changeType?: 'increase' | 'decrease';
  };
}

export default function DashboardHeader({
  title,
  subtitle,
  showTimeframeSelector = false,
  timeframe = "30",
  onTimeframeChange,
  showExportButton = false,
  onExport,
  stats,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          {title}
          {stats && (
            <Badge variant="secondary" className="ml-2">
              {stats.total.toLocaleString()}
              {stats.change && (
                <span className={`ml-1 ${stats.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                  ({stats.changeType === 'increase' ? '+' : ''}{stats.change}%)
                </span>
              )}
            </Badge>
          )}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showTimeframeSelector && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showExportButton && (
          <Button variant="outline" onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
