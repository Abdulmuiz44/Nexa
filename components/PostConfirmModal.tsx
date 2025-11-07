"use client";

import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export type Platform = 'twitter' | 'reddit'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultPlatform?: Platform
  initialContent: string
  mediaUrl?: string
  onSuccess?: (r: any) => void
}

export default function PostConfirmModal({ open, onOpenChange, defaultPlatform = 'twitter', initialContent, mediaUrl, onSuccess }: Props) {
  const [step, setStep] = useState<'confirm' | 'action' | 'schedule'>('confirm')
  const [platform, setPlatform] = useState<Platform>(defaultPlatform)
  const [content, setContent] = useState(initialContent)
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tooLongForTwitter = platform === 'twitter' && content.length > 280

  const reset = () => {
    setStep('confirm')
    setPlatform(defaultPlatform)
    setContent(initialContent)
    setScheduledAt('')
    setError(null)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const confirmPostNow = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/posts/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, content, media_url: mediaUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onSuccess?.(data)
      handleClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const schedulePost = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, content, scheduled_at: scheduledAt, media_url: mediaUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      onSuccess?.(data)
      handleClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'confirm' && 'Confirm AI-generated post'}
            {step === 'action' && 'Post options'}
            {step === 'schedule' && 'Schedule post'}
          </DialogTitle>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={(v: Platform) => setPlatform(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter / X</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Post content</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
              {tooLongForTwitter && (
                <p className="text-xs text-red-500">Over 280 chars for Twitter/X: {content.length}</p>
              )}
            </div>
            {mediaUrl && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Attached media</label>
                <Input value={mediaUrl} readOnly />
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep('action')} disabled={tooLongForTwitter}>Confirm Post</Button>
            </DialogFooter>
          </div>
        )}

        {step === 'action' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose how you want to proceed.</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={confirmPostNow} disabled={loading}>Post Now</Button>
              <Button variant="outline" onClick={() => setStep('schedule')}>Schedule for Later</Button>
            </div>
          </div>
        )}

        {step === 'schedule' && (
          <div className="space-y-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date & time</label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              <p className="text-xs text-muted-foreground">Use your local timezone. We'll store as ISO.</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('action')}>Back</Button>
              <Button onClick={schedulePost} disabled={loading || !scheduledAt}>Schedule</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}