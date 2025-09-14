import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/auth/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  target_audience: z.string().optional(),
  goals: z.string().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).optional(),
  channels: z.array(z.string()).optional(),
  content_templates: z.record(z.any()).optional(),
  schedule_config: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaign = (await db
      .prepare(`
      SELECT * FROM campaigns 
      WHERE id = ? AND user_id = ?
    `)
      .get(params.id, session.user.id)) as any

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Parse JSON fields
    campaign.channels = campaign.channels ? JSON.parse(campaign.channels) : []
    campaign.content_templates = campaign.content_templates ? JSON.parse(campaign.content_templates) : {}
    campaign.schedule_config = campaign.schedule_config ? JSON.parse(campaign.schedule_config) : {}

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Campaign fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updates = updateCampaignSchema.parse(body)

    // Check if campaign exists and belongs to user
    const existingCampaign = await db
      .prepare(`
      SELECT id FROM campaigns WHERE id = ? AND user_id = ?
    `)
      .get(params.id, session.user.id)

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Prepare update query
    const updateFields = []
    const updateValues = []

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        if (key === "channels" || key === "content_templates" || key === "schedule_config") {
          updateFields.push(`${key} = ?`)
          updateValues.push(JSON.stringify(value))
        } else {
          updateFields.push(`${key} = ?`)
          updateValues.push(value)
        }
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    updateValues.push(params.id)

    await db
      .prepare(`
      UPDATE campaigns SET ${updateFields.join(", ")}
      WHERE id = ?
    `)
      .run(...updateValues)

    return NextResponse.json({ message: "Campaign updated successfully" })
  } catch (error) {
    console.error("Campaign update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await db
      .prepare(`
      DELETE FROM campaigns 
      WHERE id = ? AND user_id = ?
    `)
      .run(params.id, session.user.id)

    if (result.changes === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Campaign deleted successfully" })
  } catch (error) {
    console.error("Campaign delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
