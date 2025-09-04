import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/agent/content-generator'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, tools(*)')
    .eq('id', campaignId)
    .single()

  const content = await generateContent(campaign.prompt, campaign.tools)

  return NextResponse.json({ content })
}