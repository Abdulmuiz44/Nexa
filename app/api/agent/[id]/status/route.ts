import { type NextRequest, NextResponse } from "next/server"
import { SupabaseAdapter } from "@/src/agent/store/supabase-adapter"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const store = new SupabaseAdapter()
    const state = await store.getState(params.id)

    if (!state) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      state,
    })
  } catch (error) {
    console.error("Failed to get agent status:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
