import { AgentRunner } from "@/src/agent/runner"
import { SkillRegistry } from "@/src/agent/skills/registry"
import { MemoryStoreAdapter } from "@/src/agent/store/memory-adapter"
import { MemoryQueueAdapter } from "@/src/agent/queue/memory-adapter"
import { Logger } from "@/src/agent/utils/logger"
import { AgentStatus, TaskStatus, type AgentConfig } from "@/src/types/agent"
import { jest } from "@jest/globals"

describe("AgentRunner", () => {
  let agent: AgentRunner
  let config: AgentConfig
  let skillRegistry: SkillRegistry
  let store: MemoryStoreAdapter
  let queue: MemoryQueueAdapter
  let logger: Logger

  beforeEach(() => {
    config = {
      id: "test-agent",
      name: "Test Agent",
      maxConcurrentTasks: 2,
      retryAttempts: 3,
      timeoutMs: 5000,
      metadata: {},
    }

    skillRegistry = new SkillRegistry()
    store = new MemoryStoreAdapter()
    queue = new MemoryQueueAdapter()
    logger = new Logger()

    agent = new AgentRunner(config, skillRegistry, store, logger, queue)
  })

  afterEach(async () => {
    if (agent.getState().status === AgentStatus.RUNNING) {
      await agent.stop()
    }
  })

  describe("lifecycle management", () => {
    it("should start successfully", async () => {
      await agent.start()
      expect(agent.getState().status).toBe(AgentStatus.RUNNING)
    })

    it("should not start if already running", async () => {
      await agent.start()
      await expect(agent.start()).rejects.toThrow("Agent is already running")
    })

    it("should stop successfully", async () => {
      await agent.start()
      await agent.stop()
      expect(agent.getState().status).toBe(AgentStatus.STOPPED)
    })

    it("should pause and resume", async () => {
      await agent.start()
      await agent.pause()
      expect(agent.getState().status).toBe(AgentStatus.PAUSED)

      await agent.resume()
      expect(agent.getState().status).toBe(AgentStatus.RUNNING)
    })
  })

  describe("task management", () => {
    beforeEach(async () => {
      // Register a mock skill
      skillRegistry.registerSkill("test-skill", {
        name: "Test Skill",
        description: "A test skill",
        execute: jest.fn().mockResolvedValue({
          data: { result: "success" },
          metadata: { tokensUsed: 100, apiCalls: 1 },
        }),
      })
    })

    it("should add tasks to queue", async () => {
      const taskId = await agent.addTask({
        type: "test-skill",
        payload: { test: "data" },
        priority: 1,
      })

      expect(taskId).toBeDefined()
      expect(typeof taskId).toBe("string")
    })

    it("should process tasks when running", async () => {
      await agent.start()

      const taskId = await agent.addTask({
        type: "test-skill",
        payload: { test: "data" },
        priority: 1,
      })

      // Wait for task processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      const state = agent.getState()
      expect(state.completedTasks).toHaveLength(1)
      expect(state.completedTasks[0].id).toBe(taskId)
      expect(state.completedTasks[0].status).toBe(TaskStatus.COMPLETED)
    })
  })

  describe("metrics", () => {
    it("should calculate metrics correctly", async () => {
      const metrics = await agent.getMetrics()

      expect(metrics).toHaveProperty("totalTasks")
      expect(metrics).toHaveProperty("completedTasks")
      expect(metrics).toHaveProperty("failedTasks")
      expect(metrics).toHaveProperty("successRate")
      expect(metrics).toHaveProperty("averageExecutionTime")
      expect(metrics).toHaveProperty("tokensUsed")
      expect(metrics).toHaveProperty("apiCalls")
      expect(metrics).toHaveProperty("uptime")
    })
  })
})
