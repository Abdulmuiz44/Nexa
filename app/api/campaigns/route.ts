import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetAudience: z.string().min(1),
  channels: z.array(z.string()),
  contentTopics: z.array(z.string()),
  schedule: z.object({
    postsPerDay: z.number().min(1).max(10),
    timezone: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
  }),
  budget: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    const campaign = {
      id: `campaign-${Date.now()}`,
      ...validatedData,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function GET() {
  try {
    const campaigns = [
      {
        id: "campaign-1",
        name: "AI Tool Launch Campaign",
        status: "active",
        channels: ["twitter", "linkedin"],
        postsPerDay: 5,
        createdAt: "2024-01-15T10:00:00Z",
      },
      {
        id: "campaign-2",
        name: "SaaS Growth Campaign",
        status: "paused",
        channels: ["twitter", "linkedin", "facebook"],
        postsPerDay: 3,
        createdAt: "2024-01-10T10:00:00Z",
      },
    ]

    return NextResponse.json({
      success: true,
      campaigns,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
