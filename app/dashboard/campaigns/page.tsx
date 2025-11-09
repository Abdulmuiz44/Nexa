"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, Edit, Trash2, Play, Pause, MoreHorizontal, RotateCcw, Wand2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Calendar as DayCalendar } from "@/components/ui/calendar";

interface Campaign {
 id: string;
 name: string;
 description?: string;
 platforms: string[];
 status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
 duration_days: number;
 posts_per_day: number;
 topic?: string;
 created_at: string;
  start_date?: string;
 end_date?: string;
}


// Studio tab content (client-side)
function StudioPanel() {
  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { toast } = useToast();
  const { data, isLoading, mutate } = useSWR('/api/posts/scheduled?status=pending', fetcher);
  const posts: any[] = Array.isArray(data?.scheduled_posts) ? data.scheduled_posts : [];

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [openComposer, setOpenComposer] = useState(false);
  const [platform, setPlatform] = useState<'twitter' | 'reddit'>('twitter');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [when, setWhen] = useState('');
  const [reschedId, setReschedId] = useState<string | null>(null);
  const [newWhen, setNewWhen] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (selectedDate && !when) {
      const d = new Date(selectedDate);
      d.setHours(9, 0, 0, 0);
      setWhen(toLocalInputValue(d));
    }
  }, [selectedDate]);

  const filtered = useMemo(() => {
    if (!selectedDate) return posts;
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();
    return posts.filter((p: any) => {
      const dt = new Date(p.scheduled_at);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    });
  }, [posts, selectedDate]);

  const dateHasPosts = (date: Date) => posts.some((p: any) => {
    const dt = new Date(p.scheduled_at);
    return dt.toDateString() === date.toDateString() && p.status === 'pending';
  });

  const onCancel = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/posts/schedule/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Cancel failed');
      toast({ title: 'Cancelled', description: 'The scheduled post was cancelled.' });
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onReschedule = async () => {
    if (!reschedId || !newWhen) return;
    setBusy(true);
    try {
      const res = await fetch('/api/posts/schedule/reschedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reschedId, scheduled_at: newWhen }) });
      if (!res.ok) throw new Error('Reschedule failed');
      toast({ title: 'Rescheduled', description: 'The scheduled time was updated.' });
      setReschedId(null);
      setNewWhen('');
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onSchedule = async () => {
    if (!content.trim() || !when) return;
    setBusy(true);
    try {
      const res = await fetch('/api/posts/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform, content: content.trim(), media_url: mediaUrl || undefined, scheduled_at: when }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Schedule failed');
      toast({ title: 'Scheduled', description: 'Post added to calendar.' });
      setOpenComposer(false);
      setContent('');
      setMediaUrl('');
      const next = fromLocalInputValue(when);
      next.setHours(next.getHours() + 2);
      setWhen(toLocalInputValue(next));
      mutate();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to schedule', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <DayCalendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ hasPosts: dateHasPosts }}
              modifiersClassNames={{ hasPosts: 'bg-primary/20 rounded-full' }}
            />
            <div className="text-xs text-muted-foreground mt-2">Days with upcoming posts are highlighted.</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{selectedDate ? selectedDate.toDateString() : 'Selected Day'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">No scheduled posts for this day.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p: any) => (
                  <div key={p.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{p.platform}</Badge>
                        <Badge className={p.status === 'pending' ? 'bg-yellow-500' : p.status === 'posted' ? 'bg-green-600' : p.status === 'failed' ? 'bg-red-600' : 'bg-gray-500'}>
                          {p.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(p.scheduled_at).toLocaleString()}</div>
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{p.content.length > 240 ? p.content.slice(0, 240) + '…' : p.content}</p>
                    {p.error_message && p.status === 'failed' && (
                      <p className="text-xs text-red-500 mt-1">{p.error_message}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" disabled={busy || p.status !== 'pending'} onClick={() => setReschedId(p.id)}>Reschedule</Button>
                      <Button size="sm" variant="destructive" disabled={busy || p.status !== 'pending'} onClick={() => onCancel(p.id)}>Cancel</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button onClick={() => setOpenComposer(true)}>New Scheduled Post</Button>
      </div>

      <Dialog open={openComposer} onOpenChange={setOpenComposer}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Compose Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select value={platform} onValueChange={(v: 'twitter' | 'reddit') => setPlatform(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="reddit">Reddit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">When</label>
                <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder={platform === 'twitter' ? 'Max 280 characters works best' : 'Provide a clear title and body for Reddit'} />
              {platform === 'twitter' && (
                <div className={`text-xs ${content.length > 280 ? 'text-red-500' : 'text-muted-foreground'}`}>{content.length}/280</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Media URL (optional)</label>
              <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenComposer(false)}>Close</Button>
            <Button onClick={onSchedule} disabled={busy || !content.trim() || !when || (platform === 'twitter' && content.length > 280)}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reschedId} onOpenChange={(o) => { if (!o) { setReschedId(null); setNewWhen(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">New date & time</label>
            <Input type="datetime-local" value={newWhen} onChange={(e) => setNewWhen(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReschedId(null); setNewWhen(''); }}>Close</Button>
            <Button onClick={onReschedule} disabled={!newWhen || busy}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromLocalInputValue(s: string) {
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  return new Date();
}

export default function CampaignsPage() {
const [campaigns, setCampaigns] = useState<Campaign[]>([]);
const [loading, setLoading] = useState(true);
const router = useRouter();

useEffect(() => {
fetchCampaigns();
}, []);

const fetchCampaigns = async () => {
try {
const response = await fetch('/api/campaigns');
if (response.ok) {
const data = await response.json();
setCampaigns(data.campaigns || []);
}
} catch (error) {
console.error('Error fetching campaigns:', error);
} finally {
      setLoading(false);
}
};

const getStatusColor = (status: string) => {
switch (status) {
case 'active': return 'bg-green-500';
case 'draft': return 'bg-gray-500';
case 'paused': return 'bg-yellow-500';
case 'completed': return 'bg-blue-500';
case 'cancelled': return 'bg-red-500';
default: return 'bg-gray-500';
}
};

const getStatusIcon = (status: string) => {
switch (status) {
case 'active': return <Play className="h-3 w-3" />;
case 'paused': return <Pause className="h-3 w-3" />;
default: return null;
}
  };

const handleCreateCampaign = () => {
router.push('/dashboard/campaigns/new');
};

const handleEditCampaign = (campaignId: string) => {
router.push(`/dashboard/campaigns/${campaignId}/edit`);
};

const handleDeleteCampaign = async (campaignId: string) => {
if (!confirm('Are you sure you want to delete this campaign?')) return;

  try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
      } else {
        alert('Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Manage and schedule your social media campaigns
            </p>
          </div>
          <Button onClick={handleCreateCampaign}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Overview</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {campaign.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1 capitalize">{campaign.status}</span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCampaign(campaign.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {campaign.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Platforms:</span>
                        <div className="flex gap-1">
                          {campaign.platforms.map((platform) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{campaign.duration_days} days</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Posts/Day:</span>
                        <span>{campaign.posts_per_day}</span>
                      </div>
                      {campaign.topic && (
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Topic:</span>
                          <span>{campaign.topic}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Create Campaign Card */}
              <Card className="p-6 border-dashed border-2 hover:border-primary transition-colors cursor-pointer" onClick={handleCreateCampaign}>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create Campaign</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Set up automated posting schedules and content strategies
                  </p>
                </CardContent>
              </Card>
            </div>

            {campaigns.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first campaign to start automating your social media presence
                </p>
                <Button onClick={handleCreateCampaign}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="studio">
            <StudioPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
