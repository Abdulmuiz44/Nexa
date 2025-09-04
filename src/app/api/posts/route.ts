import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { postToX } from '@/lib/platforms/x'
import { postToReddit } from '@/lib/platforms/reddit'
import { postToTelegram } from '@/lib/platforms/telegram'

export async function POST(request: NextRequest) {
  const { campaignId, platform, content } = await request.json()

  let result
  switch (platform) {
    case 'x':
      result = await postToX(content)
      break
    case 'reddit':
      result = await postToReddit('algotrading', content.substring(0, 50), content)
      break
    case 'telegram':
      result = await postToTelegram('@your_channel', content)
      break
  }

  const { data } = await supabase
    .from('posts')
    .insert({
      campaign_id: campaignId,
      platform,
      content,
      status: 'posted',
      posted_at: new Date().toISOString()
    })
    .select()
    .single()

  return NextResponse.json({ post: data, platformResult: result })
}