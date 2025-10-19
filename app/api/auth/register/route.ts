import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { supabase } from "@/src/lib/db"
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
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and generate API key
    const passwordHash = await hash(password, 12)
    const apiKey = generateApiKey()

    // Create user
    const { data: newUser, error: newUserError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          name,
          api_key: apiKey,
        },
      ])
      .select()

    if (newUserError) {
      throw newUserError
    }

    return NextResponse.json({
      message: "User created successfully",
      userId: newUser[0].id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}