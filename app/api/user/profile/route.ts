import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/src/auth/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar_url: z.string().url().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = (await db
      .prepare(`
      SELECT id, email, name, avatar_url, subscription_tier, api_key, created_at, last_login
      FROM users WHERE id = ?
    `)
      .get(session.user.id)) as any

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updates = updateProfileSchema.parse(body)

    const updateFields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ")
    const updateValues = Object.values(updates)

    await db
      .prepare(`
      UPDATE users SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
      .run(...updateValues, session.user.id)

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
