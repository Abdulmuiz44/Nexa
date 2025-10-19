"use client";

import Navbar from "@/components/Navbar";
import ContentGenerator from "@/components/ContentGenerator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, Calendar, TrendingUp, MessageSquare, Settings, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 flex flex-col items-center">
        <div className="container px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Monitor your AI growth agents</p>
            </div>
            <Button variant="hero" size="lg">
              <Plus className="mr-2" />
              Add New Project
            </Button>
          </div>

          {/* Agent Status */}
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { icon: TrendingUp, label: "Total Posts", value: "142", change: "+12%" },
              { icon: MessageSquare, label: "Engagements", value: "1,284", change: "+24%" },
              { icon: Calendar, label: "This Week", value: "38", change: "+8%" },
              { icon: Bot, label: "AI Score", value: "94/100", change: "+5%" },
            ].map((stat, idx) => (
              <Card key={idx} className="p-6 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <span className="text-success text-sm font-semibold">{stat.change}</span>
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Tabbed Interface */}
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="generator">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generator
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {[
                  { action: "Posted to Reddit", target: "r/SaaS", time: "2 min ago", status: "success" },
                  { action: "Replied to comment", target: "@techstartup on X", time: "15 min ago", status: "success" },
                  { action: "Scheduled post", target: "Product Hunt", time: "1 hour ago", status: "pending" },
                  { action: "Generated content", target: "Launch campaign", time: "2 hours ago", status: "success" },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className={`h-2 w-2 rounded-full ${activity.status === 'success' ? 'bg-success' : 'bg-accent'} animate-pulse`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.target}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <MessageSquare className="mr-2" />
                  Create Post
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Calendar className="mr-2" />
                  Schedule Campaign
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <TrendingUp className="mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Settings className="mr-2" />
                  Agent Settings
                </Button>
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
                <p className="text-muted-foreground mb-4">
                  Detailed performance metrics coming soon
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;