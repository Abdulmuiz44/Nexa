"use client";

import useSWR from 'swr'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/components/ui/use-toast'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type ScheduledPost = {
  id: string
  user_id: string
  platform: 'twitter' | 'reddit'
  content: string
  media_url?: string | null
  status: 'pending' | 'posted' | 'failed' | 'cancelled'
  scheduled_at: string
  posted_at?: string | null
  error_message?: string | null
}

export default function ScheduledPostsPage() {
  if (typeof window === 'undefined') return null as any;
  const { data, mutate, isLoading } = useSWR('/api/posts/scheduled', fetcher)
  const posts: ScheduledPost[] = data?.scheduled_posts || []

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [reschedId, setReschedId] = useState<string | null>(null)
  const [newWhen, setNewWhen] = useState('')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  const filtered = useMemo(() => {
    if (!selectedDate) return posts
    const y = selectedDate.getFullYear()
    const m = selectedDate.getMonth()
    const d = selectedDate.getDate()
    return posts.filter(p => {
      const dt = new Date(p.scheduled_at)
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
    })
  }, [posts, selectedDate])

  const onCancel = async (id: string) => {
    setBusy(true)
    try {
      const res = await fetch('/api/posts/schedule/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error('Cancel failed')
      toast({ title: 'Cancelled', description: 'The scheduled post was cancelled.' })
      mutate()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const onReschedule = async () => {
    if (!reschedId || !newWhen) return
    setBusy(true)
    try {
      const res = await fetch('/api/posts/schedule/reschedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reschedId, scheduled_at: newWhen }) })
      if (!res.ok) throw new Error('Reschedule failed')
      toast({ title: 'Rescheduled', description: 'The scheduled time was updated.' })
      setReschedId(null)
      setNewWhen('')
      mutate()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  const dateHasPosts = (date: Date) => posts.some(p => {
    const dt = new Date(p.scheduled_at)
    return dt.toDateString() === date.toDateString() && p.status === 'pending'
  })

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Scheduled Posts</h1>
          <p className="text-muted-foreground mt-2">View, cancel, and reschedule upcoming posts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
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
              <CardTitle>{selectedDate ? selectedDate.toDateString() : 'All Upcoming'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground">No scheduled posts.</div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(p => (
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
                      <p className="text-sm mt-2 whitespace-pre-wrap">
                        {p.content.length > 240 ? p.content.slice(0, 240) + '…' : p.content}
                      </p>
                      {p.error_message && p.status === 'failed' && (
                        <p className="text-xs text-red-500 mt-1">{p.error_message}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || p.status !== 'pending'}
                          onClick={() => setReschedId(p.id)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy || p.status !== 'pending'}
                          onClick={() => onCancel(p.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reschedule dialog */}
        <Dialog open={!!reschedId} onOpenChange={(o) => { if (!o) { setReschedId(null); setNewWhen('') } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium">New date & time</label>
              <Input type="datetime-local" value={newWhen} onChange={(e) => setNewWhen(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setReschedId(null); setNewWhen('') }}>Close</Button>
              <Button onClick={onReschedule} disabled={!newWhen || busy}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}