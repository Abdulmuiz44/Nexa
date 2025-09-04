import { generateContent } from './content-generator'

interface Decision {
  action: "post" | "wait"
  platform: string
  content: string
  campaignId: string
}

export async function makeDecision(campaigns: any[], lastPosts: any[]): Promise<Decision[]> {
  const decisions: Decision[] = []

  for (const campaign of campaigns) {
    if (!campaign.active) continue

    const lastPost = lastPosts.find(p => p.campaign_id === campaign.id)
    const hoursSinceLastPost = lastPost ?
      (Date.now() - new Date(lastPost.created_at).getTime()) / (1000 * 60 * 60) : 24

    const shouldPost =
      (campaign.frequency === 'daily' && hoursSinceLastPost >= 24) ||
      (campaign.frequency === 'every-2-days' && hoursSinceLastPost >= 48)

    if (shouldPost) {
      const content = await generateContent(campaign.prompt, campaign.tool)
      decisions.push({
        action: "post",
        platform: campaign.platforms[Math.floor(Math.random() * campaign.platforms.length)],
        content,
        campaignId: campaign.id
      })
    }
  }

  return decisions
}