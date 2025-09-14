"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface CampaignFormProps {
  onSubmit: (campaign: any) => void
  isLoading?: boolean
}

export function CampaignForm({ onSubmit, isLoading }: CampaignFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetAudience: "",
    channels: [] as string[],
    budget: "",
    duration: "7",
    contentThemes: [] as string[],
    goals: "",
  })

  const [newTheme, setNewTheme] = useState("")

  const availableChannels = [
    { id: "twitter", name: "Twitter" },
    { id: "linkedin", name: "LinkedIn" },
    { id: "reddit", name: "Reddit" },
    { id: "hackernews", name: "Hacker News" },
    { id: "producthunt", name: "Product Hunt" },
  ]

  const handleChannelToggle = (channelId: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter((c) => c !== channelId)
        : [...prev.channels, channelId],
    }))
  }

  const addTheme = () => {
    if (newTheme.trim() && !formData.contentThemes.includes(newTheme.trim())) {
      setFormData((prev) => ({
        ...prev,
        contentThemes: [...prev.contentThemes, newTheme.trim()],
      }))
      setNewTheme("")
    }
  }

  const removeTheme = (theme: string) => {
    setFormData((prev) => ({
      ...prev,
      contentThemes: prev.contentThemes.filter((t) => t !== theme),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="My AI Tool Launch"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your campaign goals and strategy..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="Developers, entrepreneurs, AI enthusiasts..."
            />
          </div>

          <div className="space-y-2">
            <Label>Marketing Channels</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableChannels.map((channel) => (
                <Button
                  key={channel.id}
                  type="button"
                  variant={formData.channels.includes(channel.id) ? "default" : "outline"}
                  onClick={() => handleChannelToggle(channel.id)}
                  className="justify-start"
                >
                  {channel.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content Themes</Label>
            <div className="flex gap-2">
              <Input
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="Add a content theme..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTheme())}
              />
              <Button type="button" onClick={addTheme}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.contentThemes.map((theme) => (
                <Badge key={theme} variant="secondary" className="flex items-center gap-1">
                  {theme}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTheme(theme)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Campaign Goals</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) => setFormData((prev) => ({ ...prev, goals: e.target.value }))}
              placeholder="Increase brand awareness, generate leads, drive signups..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Campaign..." : "Create Campaign"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
