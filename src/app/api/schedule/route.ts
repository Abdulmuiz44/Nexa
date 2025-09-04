import { NextResponse } from 'next/server'
import { makeDecision } from '@/lib/agent/decision-engine'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: campaigns } = await supabase.from('campaigns').select('*')
  const { data: lastPosts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const decisions = await makeDecision(campaigns || [], lastPosts || [])

  for (const decision of decisions) {
    if (decision.action === 'post') {
      // Trigger post API
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: decision.campaignId,
          platform: decision.platform,
          content: decision.content
        })
      })
    }
  }

  return NextResponse.json({ processed: decisions.length })
}