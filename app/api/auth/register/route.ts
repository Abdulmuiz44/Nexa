import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { generateApiKey } from "@/lib/utils"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?").get(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and generate API key
    const passwordHash = await hash(password, 12)
    const apiKey = generateApiKey()

    // Create user
    const result = await db
      .prepare(`
      INSERT INTO users (email, password_hash, name, api_key)
      VALUES (?, ?, ?, ?)
    `)
      .run(email, passwordHash, name, apiKey)

    return NextResponse.json({
      message: "User created successfully",
      userId: result.lastInsertRowid,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
