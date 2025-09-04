'use client';

// NEXA - Main Dashboard Page
// This is your AI agent control center

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Settings,
  Play,
  Pause,
  Plus,
  Globe,
  Users,
  MessageSquare,
  Eye,
  ThumbsUp,
  Share,
  ExternalLink,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalPosts: number;
  totalImpressions: number;
  totalEngagement: number;
  engagementRate: number;
  platformStats: Array<{
    platform: string;
    posts: number;
    engagement: number;
    impressions: number;
  }>;
}

interface Campaign {
  id: string;
  name: string;
  active: boolean;
  platforms: string[];
  frequency: string;
  tools: { name: string };
  performance_score: number;
}

interface RecentPost {
  id: string;
  content: string;
  platform: string;
  posted_at: string;
  campaigns: { name: string; tools: { name: string } };
  analytics: Array<{
    likes: number;
    shares: number;
    comments: number;
    impressions: number;
  }>;
}

export default function NexaDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load analytics stats
      const analyticsRes = await fetch('/api/analytics?type=overview&days=30');
      const analyticsData = await analyticsRes.json();
      
      // Load campaigns
      const campaignsRes = await fetch('/api/campaigns');
      const campaignsData = await campaignsRes.json();
      
      // Load platform stats
      const platformRes = await fetch('/api/analytics?type=platforms&days=30');
      const platformData = await platformRes.json();

      // Load recent posts
      const postsRes = await fetch('/api/analytics?type=top_posts&days=7');
      const postsData = await postsRes.json();

      setStats({
        totalCampaigns: campaignsData.campaigns?.length || 0,
        activeCampaigns: campaignsData.campaigns?.filter((c: Campaign) => c.active).length || 0,
        totalPosts: analyticsData.data?.totalPosts || 0,
        totalImpressions: analyticsData.data?.totalImpressions || 0,
        totalEngagement: analyticsData.data?.totalEngagement || 0,
        engagementRate: analyticsData.data?.engagementRate || 0,
        platformStats: platformData.data || []
      });

      setCampaigns(campaignsData.campaigns || []);
      setRecentPosts(postsData.data || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTrigger = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' })
      });
      
      const result = await response.json();
      if (result.success) {
        // Reload data after successful run
        setTimeout(loadDashboardData, 2000);
      }
    } catch (error) {
      console.error('Manual trigger failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleCampaign = async (campaignId: string, active: boolean) => {
    try {
      await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaignId, active: !active })
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Failed to toggle campaign:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Nexa Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nexa</h1>
                <p className="text-sm text-gray-500">AI Growth Agent</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualTrigger}
                disabled={isRunning}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Manual Trigger
                  </>
                )}
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalCampaigns || 0}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm text-green-600 mt-2">
              {stats?.activeCampaigns || 0} active
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.totalPosts || 0)}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last 30 days
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Impressions</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats?.totalImpressions || 0)}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-purple-600 mt-2">
              +{formatNumber(stats?.totalEngagement || 0)} engagement
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.engagementRate?.toFixed(1) || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-sm text-orange-600 mt-2">
              Above average
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaigns List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
                  <button className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </button>
                </div>
              </div>
              
              <div className="divide-y">
                {campaigns.length > 0 ? campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-500">Promoting {campaign.tools?.name}</p>
                      </div>
                      <button
                        onClick={() => toggleCampaign(campaign.id, campaign.active)}
                        className={`p-2 rounded-lg ${
                          campaign.active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {campaign.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        {campaign.platforms.join(', ')}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {campaign.frequency}
                      </span>
                      <span className={`flex items-center px-2 py-1 rounded-full text-xs ${
                        campaign.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {campaign.active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Paused
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Yet</h3>
                    <p className="text-gray-500 mb-4">Create your first campaign to start promoting Tradia automatically.</p>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Campaign
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform Stats */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Platform Performance</h2>
              </div>
              
              <div className="p-6 space-y-4">
                {stats?.platformStats.length ? stats.platformStats.map((platform) => (
                  <div key={platform.platform} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {platform.platform}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatNumber(platform.engagement)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {platform.posts} posts
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No platform data yet</p>
                )}
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
              </div>
              
              <div className="divide-y max-h-96 overflow-y-auto">
                {recentPosts.length > 0 ? recentPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${
                        post.platform === 'twitter' ? 'bg-blue-100 text-blue-600' :
                        post.platform === 'reddit' ? 'bg-orange-100 text-orange-600' :
                        post.platform === 'discord' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {post.platform}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(post.posted_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                      {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {formatNumber(post.analytics?.[0]?.impressions || 0)}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {formatNumber(post.analytics?.[0]?.likes || 0)}
                      </span>
                      <span className="flex items-center">
                        <Share className="h-3 w-3 mr-1" />
                        {formatNumber(post.analytics?.[0]?.shares || 0)}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="p-6 text-center">
                    <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No posts yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tradia Promotion Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">🚀 Promoting Tradia - AI Trading Assistant</h2>
                <p className="text-blue-100">
                  Your AI agent is working hard to promote Tradia across multiple platforms.
                  Track performance and optimize your campaigns above.
                </p>
              </div>
              <a
                href="https://github.com/Abdulmuiz44/Tradia.git"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Tradia
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
