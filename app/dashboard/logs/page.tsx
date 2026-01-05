"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, MessageSquare, Bot, AlertCircle, CheckCircle } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string; // ISO string from API
  type: string;
  message: string;
  metadata?: Record<string, any>;
}

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e) {
        console.error('Logs fetch error', e);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'user_action': return MessageSquare;
      case 'ai_response': return Bot;
      case 'system': return CheckCircle;
      case 'error': return AlertCircle;
      default: return Activity;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'user_action': return 'text-blue-500';
      case 'ai_response': return 'text-green-500';
      case 'system': return 'text-purple-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = (log.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || log.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [logs, filterType, searchTerm]);

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Activity Logs
          </h1>
          <p className="text-muted-foreground mt-2">Track all system activities, user actions, and AI interactions</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="user_action">User Actions</SelectItem>
              <SelectItem value="ai_response">AI Responses</SelectItem>
              <SelectItem value="system">System Events</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        <Card className="p-6">
          <CardHeader className="pb-4">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const Icon = getLogIcon(log.type);
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className={`p-2 rounded-full bg-muted ${getLogColor(log.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{log.message}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No logs found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Log Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">{filteredLogs.filter(l => l.type === 'user_action').length}</div>
            <div className="text-sm text-muted-foreground">User Actions</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500 mb-1">{filteredLogs.filter(l => l.type === 'ai_response').length}</div>
            <div className="text-sm text-muted-foreground">AI Responses</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500 mb-1">{filteredLogs.filter(l => l.type === 'system').length}</div>
            <div className="text-sm text-muted-foreground">System Events</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500 mb-1">{filteredLogs.filter(l => l.type === 'error').length}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
