"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/db";
import Navbar from "@/components/Navbar";
import ContentGenerator from "@/components/ContentGenerator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, Calendar, TrendingUp, MessageSquare, Settings, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [stats, setStats] = useState({ totalPosts: 0, engagements: 0, thisWeek: 0, aiScore: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user) {
        setLoading(true);
        const { data, error } = await supabase
          .from("generated_contents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching dashboard data:", error);
        } else {
          setRecentActivity(data);
          // Placeholder for stats calculation
          setStats({
            totalPosts: data.length,
            engagements: 1284, // Placeholder
            thisWeek: data.filter(d => new Date(d.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            aiScore: 94, // Placeholder
          });
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create_post":
        setActiveTab("generator");
        break;
      case "view_analytics":
        setActiveTab("analytics");
        break;
      case "schedule_campaign":
      case "agent_settings":
        toast({ title: "Coming Soon!", description: "This feature is under development." });
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 flex flex-col items-center">
        <div className="container px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
            </div>
            <Button variant="hero" size="lg" onClick={() => toast({ title: "Coming Soon!", description: "Project management is under development." }) }>
              <Plus className="mr-2" />
              Add New Project
            </Button>
          </div>

          <Card className="p-6 mb-8 bg-gradient-to-br from-card to-primary/5 border-primary/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Bot className="h-12 w-12 text-primary animate-pulse-glow" />
                  <div className="absolute inset-0 blur-xl bg-primary/50" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Agent Status: Active</h2>
                  <p className="text-muted-foreground">Your AI agent is working 24/7</p>
                </div>
              </div>
              <Badge className="bg-success text-success-foreground px-4 py-2 text-sm font-semibold">
                Online
              </Badge>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div className="text-3xl font-bold mb-1">{stats.totalPosts}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4"><MessageSquare className="h-5 w-5 text-primary" /></div>
              <div className="text-3xl font-bold mb-1">{stats.engagements}</div>
              <div className="text-sm text-muted-foreground">Engagements</div>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4"><Calendar className="h-5 w-5 text-primary" /></div>
              <div className="text-3xl font-bold mb-1">{stats.thisWeek}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </Card>
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4"><Bot className="h-5 w-5 text-primary" /></div>
              <div className="text-3xl font-bold mb-1">{stats.aiScore}/100</div>
              <div className="text-sm text-muted-foreground">AI Score</div>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="generator"><Sparkles className="h-4 w-4 mr-2" />AI Generator</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Bot className="h-5 w-5 text-primary" />Recent Activity</h3>
                  <div className="space-y-4">
                    {loading ? <p>Loading activity...</p> : recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        <div className="flex-1">
                          <p className="font-medium">Generated {activity.content_type} for {activity.platform}</p>
                          <p className="text-sm text-muted-foreground">{activity.tool_name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => handleQuickAction("create_post")}><MessageSquare className="mr-2" />Create Post</Button>
                    <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => handleQuickAction("schedule_campaign")}><Calendar className="mr-2" />Schedule Campaign</Button>
                    <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => handleQuickAction("view_analytics")}><TrendingUp className="mr-2" />View Analytics</Button>
                    <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => handleQuickAction("agent_settings")}><Settings className="mr-2" />Agent Settings</Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="generator" className="mt-6">
              <ContentGenerator />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Card className="p-8 text-center bg-card/50 backdrop-blur-sm">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground mb-4">Detailed performance metrics coming soon</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;