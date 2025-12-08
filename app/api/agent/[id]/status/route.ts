import { type NextRequest, NextResponse } from "next/server"
import { SupabaseAdapter } from "@/src/agent/store/supabase-adapter"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const store = new SupabaseAdapter()
    const state = await store.getState(resolvedParams.id)

    if (!state) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      state,
    })
  } catch (error: unknown) {
    console.error("Failed to get agent status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get agent status',
      },
      { status: 500 },
    )
  }
}
