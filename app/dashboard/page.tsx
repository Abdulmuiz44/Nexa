"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/db";
import Navbar from "@/components/Navbar";
import ContentGenerator from "@/components/ContentGenerator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, Calendar, TrendingUp, MessageSquare, Settings, Plus, Sparkles, CreditCard, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
const { data: session } = useSession();
const { toast } = useToast();
const [stats, setStats] = useState({ totalPosts: 0, engagements: 0, thisWeek: 0, aiScore: 0 });
const [recentActivity, setRecentActivity] = useState<any[]>([]);
const [onboardingData, setOnboardingData] = useState<any>(null);
const [userStatus, setUserStatus] = useState<string>('onboarding');
const [loading, setLoading] = useState(true);
const [creditBalance, setCreditBalance] = useState<number>(0);
 const [creditTransactions, setCreditTransactions] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
  const fetchData = async () => {
  if (session?.user) {
  setLoading(true);

  // Fetch user data including status and onboarding
  const { data: userData, error: userError } = await supabase
  .from('users')
  .select('status, onboarding_data')
  .eq('id', session.user.id)
  .single();

  if (!userError && userData) {
  setUserStatus(userData.status || 'onboarding');
    if (userData.onboarding_data) {
            setOnboardingData(userData.onboarding_data);
          }
        }

  // Fetch recent activity
  const { data, error } = await supabase
  .from("generated_contents")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(5);

  // Fetch credit balance and transactions
  const creditResponse = await fetch('/api/credits/balance');
  if (creditResponse.ok) {
    const creditData = await creditResponse.json();
    setCreditBalance(creditData.balance || 0);
    setCreditTransactions(creditData.transactions || []);
  }

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

  const handleStartAgent = async () => {
    try {
      const response = await fetch('/api/agent/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Agent Started!",
          description: data.message || "Your AI Growth Agent is now active.",
        });
        // Refresh page to update status
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to start agent.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start agent. Please try again.",
        variant: "destructive",
      });
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

          <Card className="p-4 sm:p-6 mb-8 bg-gradient-to-br from-card to-primary/5 border-primary/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
          <div className="relative">
          <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-pulse-glow" />
          <div className="absolute inset-0 blur-xl bg-primary/50" />
          </div>
          <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1">
            Agent Status: {userStatus === 'agent_active' ? 'Active' : userStatus === 'agent_paused' ? 'Paused' : 'Inactive'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {userStatus === 'agent_active' ? 'Your AI agent is working 24/7' :
             userStatus === 'agent_paused' ? 'Your AI agent is paused' :
             'Start your AI agent to begin automated growth'}
          </p>
          </div>
          </div>
          <Badge className={`px-4 py-2 text-sm font-semibold self-start sm:self-center ${
            userStatus === 'agent_active'
              ? 'bg-success text-success-foreground'
              : userStatus === 'agent_paused'
              ? 'bg-warning text-warning-foreground'
              : 'bg-muted text-muted-foreground'
          }`}>
            {userStatus === 'agent_active' ? 'Online' : userStatus === 'agent_paused' ? 'Paused' : 'Offline'}
          </Badge>
          </div>
          </Card>

          {onboardingData && userStatus !== 'agent_active' && (
            <Card className="p-6 mb-8 bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">Your Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Business</p>
                  <p className="font-medium">{onboardingData.business_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{onboardingData.business_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goals</p>
                  <p className="font-medium">{onboardingData.promotion_goals?.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Posting Frequency</p>
                  <p className="font-medium">{onboardingData.posting_frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand Tone</p>
                  <p className="font-medium">{onboardingData.brand_tone}</p>
                </div>
                {onboardingData.website_url && (
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium">{onboardingData.website_url}</p>
                  </div>
                )}
              </div>
              <Button variant="hero" size="lg" onClick={handleStartAgent}>
              <Bot className="mr-2" />
              Start Growth Agent
              </Button>
            </Card>
          )}

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
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4"><CreditCard className="h-5 w-5 text-primary" /></div>
              <div className="text-3xl font-bold mb-1">{creditBalance}</div>
              <div className="text-sm text-muted-foreground">Credits</div>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 md:max-w-lg md:grid-cols-4 flex-wrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="generator" className="text-xs sm:text-sm"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />AI Generator</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="credits" className="text-xs sm:text-sm"><CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />Credits</TabsTrigger>
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

            <TabsContent value="credits" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Credit Balance Card */}
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <CreditCard className="h-8 w-8 text-primary" />
                    <Badge className={`px-3 py-1 ${creditBalance > 10 ? 'bg-success' : creditBalance > 0 ? 'bg-warning' : 'bg-destructive'}`}>
                      {creditBalance > 10 ? 'Good' : creditBalance > 0 ? 'Low' : 'Empty'}
                    </Badge>
                  </div>
                  <div className="text-4xl font-bold mb-2">{creditBalance}</div>
                  <div className="text-sm text-muted-foreground mb-4">Available Credits</div>
                  <div className="text-xs text-muted-foreground">1 credit = $0.10</div>
                  <div className="mt-4">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => window.open('/pricing', '_blank')}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Buy Credits
                    </Button>
                  </div>
                </Card>

                {/* Recent Transactions */}
                <Card className="lg:col-span-2 p-6 bg-card/50 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Recent Transactions
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {creditTransactions.length > 0 ? (
                      creditTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${
                              transaction.tx_type === 'earn' ? 'bg-success' :
                              transaction.tx_type === 'spend' ? 'bg-destructive' :
                              transaction.tx_type === 'purchase' ? 'bg-primary' :
                              'bg-muted'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${
                            transaction.tx_type === 'earn' || transaction.tx_type === 'purchase' ? 'text-success' :
                            transaction.tx_type === 'spend' ? 'text-destructive' :
                            'text-muted-foreground'
                          }`}>
                            {transaction.tx_type === 'earn' || transaction.tx_type === 'purchase' ? '+' : '-'}
                            {transaction.credits} credits
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-muted mx-auto mb-4" />
                        <p className="text-muted-foreground">No transactions yet</p>
                        <p className="text-sm text-muted-foreground">Your credit activity will appear here</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Credit Packages */}
              <Card className="mt-6 p-6 bg-card/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Credit Packages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { credits: 100, usd: 10, popular: false },
                    { credits: 250, usd: 25, popular: false },
                    { credits: 500, usd: 45, popular: true },
                    { credits: 1000, usd: 80, popular: false },
                    { credits: 2500, usd: 180, popular: false },
                  ].map((pkg) => (
                    <Card key={pkg.credits} className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      pkg.popular ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">{pkg.credits}</div>
                        <div className="text-sm text-muted-foreground mb-2">Credits</div>
                        <div className="text-lg font-semibold mb-3">${pkg.usd}</div>
                        {pkg.popular && (
                          <Badge className="mb-3 bg-primary text-primary-foreground">Most Popular</Badge>
                        )}
                        <Button
                          size="sm"
                          className="w-full"
                          variant={pkg.popular ? "default" : "outline"}
                          onClick={() => window.open('/pricing', '_blank')}
                        >
                          Buy Now
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;