import { type NextRequest, NextResponse } from "next/server"
import { SupabaseAdapter } from "@/src/agent/store/supabase-adapter"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const resolvedParams = await params
    const store = new SupabaseAdapter()
    const logs = await store.getLogs(resolvedParams.id, { limit, offset })

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error("Failed to get agent logs:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
