import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const encoder = new TextEncoder()
const JWT_SECRET = process.env.JWT_SECRET

export async function verifyAuthToken(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!JWT_SECRET) {
    console.warn("JWT_SECRET is not configured for middleware auth")
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  try {
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET))
    const response = NextResponse.next()
    if (payload && typeof payload === "object" && "userId" in payload) {
      response.headers.set("x-user-id", String(payload.userId))
    }
    return response
  } catch (error) {
    console.error("JWT verification failed", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
