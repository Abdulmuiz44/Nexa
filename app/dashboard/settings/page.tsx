"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, Shield, Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabaseClient } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const u = await res.json();
          setName(u?.name || "");
          setEmail(u?.email || "");
          setAvatarUrl(u?.avatar_url || "");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar_url: avatarUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Failed to save profile', description: data.error || 'Try again later', variant: 'destructive' });
      } else {
        toast({ title: 'Profile updated' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and profile settings</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt="Profile" />
                  <AvatarFallback>{name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="space-y-2 w-full max-w-sm">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                  <div>
                    <Label className="mr-2">Or upload</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!supabaseClient) {
                          toast({ title: 'Upload failed', description: 'Supabase client not configured', variant: 'destructive' });
                          return;
                        }
                        try {
                          const path = `${Date.now()}-${file.name}`;
                          const { error } = await supabaseClient.storage.from('avatars').upload(path, file, { upsert: true });
                          if (error) throw error;
                          const { data } = supabaseClient.storage.from('avatars').getPublicUrl(path);
                          const url = data.publicUrl;
                          setAvatarUrl(url);
                          await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar_url: url }) });
                          toast({ title: 'Avatar updated' });
                        } catch (err: any) {
                          toast({ title: 'Upload failed', description: err?.message || 'Check Supabase Storage', variant: 'destructive' });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>

              <div className="flex justify-end">
                <Button onClick={onSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings (visual only unless backend fields exist) */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your campaigns</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Post Confirmations</Label>
                  <p className="text-sm text-muted-foreground">Get notified when posts are published</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly performance summaries</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings (stub) */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">Password updates are managed via your identity provider.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
