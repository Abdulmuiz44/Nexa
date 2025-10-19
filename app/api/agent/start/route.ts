import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { AgentRunner } from "@/src/agent/runner"
import { SkillRegistry } from "@/src/agent/skills/registry"
import { SupabaseAdapter } from "@/src/agent/store/supabase-adapter"
import { MemoryQueueAdapter } from "@/src/agent/queue/memory-adapter"
import { createLogger } from "@/src/agent/utils/logger"
import type { AgentConfig } from "@/src/types/agent"

const startAgentSchema = z.object({
  campaignName: z.string().min(1),
  targetAudience: z.string().min(1),
  channels: z.array(z.enum(["twitter", "linkedin", "facebook", "instagram"])),
  contentTopics: z.array(z.string()),
  schedule: z.object({
    postsPerDay: z.number().min(1).max(10),
    timezone: z.string(),
  }),
  budget: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = startAgentSchema.parse(body)

    const config: AgentConfig = {
      id: `agent-${Date.now()}`,
      name: validatedData.campaignName,
      maxConcurrentTasks: 3,
      retryAttempts: 3,
      timeoutMs: 300000, // 5 minutes
      metadata: {
        targetAudience: validatedData.targetAudience,
        channels: validatedData.channels,
        contentTopics: validatedData.contentTopics,
        schedule: validatedData.schedule,
        budget: validatedData.budget,
      },
    }

    const logger = createLogger("agent-start")
    const store = new SupabaseAdapter()
    const queue = new MemoryQueueAdapter()
    const skillRegistry = new SkillRegistry()

    const agent = new AgentRunner(config, skillRegistry, store, logger, queue)
    await agent.start()

    for (const topic of validatedData.contentTopics) {
      await agent.addTask({
        type: "content-generation",
        payload: {
          topic,
          targetAudience: validatedData.targetAudience,
          channels: validatedData.channels,
        },
        priority: 1,
        maxRetries: 3,
      })
    }

    return NextResponse.json({
      success: true,
      agentId: config.id,
      message: "Agent started successfully",
    })
  } catch (error) {
    console.error("Failed to start agent:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
