import { EventEmitter } from "events"
import {
  type AgentState,
  AgentStatus,
  type Task,
  TaskStatus,
  type AgentConfig,
  type AgentMetrics,
} from "../types/agent"
import type { SkillRegistry } from "./skills/registry"
import type { AgentStore } from "./store/interface"
import type { Logger } from "./utils/logger"
import type { JobQueue } from "./queue/interface"

export class AgentRunner extends EventEmitter {
  private state: AgentState
  private config: AgentConfig
  private skillRegistry: SkillRegistry
  private store: AgentStore
  private logger: Logger
  private jobQueue: JobQueue
  private runningTasks = new Map<string, Promise<void>>()
  private shutdownSignal = false

  constructor(
    config: AgentConfig,
    skillRegistry: SkillRegistry,
    store: AgentStore,
    logger: Logger,
    jobQueue: JobQueue,
  ) {
    super()
    this.config = config
    this.skillRegistry = skillRegistry
    this.store = store
    this.logger = logger
    this.jobQueue = jobQueue

    this.state = {
      id: config.id,
      status: AgentStatus.IDLE,
      completedTasks: [],
      failedTasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    }
  }

  async start(): Promise<void> {
    if (this.state.status === AgentStatus.RUNNING) {
      throw new Error("Agent is already running")
    }

    this.logger.info("Starting agent", { agentId: this.config.id })
    this.state.status = AgentStatus.RUNNING
    this.state.updatedAt = new Date()
    this.shutdownSignal = false

    await this.store.saveState(this.state)
    this.emit("started", this.state)

    // Start processing tasks
    this.processTaskQueue()
  }

  async stop(): Promise<void> {
    this.logger.info("Stopping agent", { agentId: this.config.id })
    this.shutdownSignal = true
    this.state.status = AgentStatus.STOPPED
    this.state.updatedAt = new Date()

    // Wait for running tasks to complete
    await Promise.all(this.runningTasks.values())

    await this.store.saveState(this.state)
    this.emit("stopped", this.state)
  }

  async pause(): Promise<void> {
    this.logger.info("Pausing agent", { agentId: this.config.id })
    this.state.status = AgentStatus.PAUSED
    this.state.updatedAt = new Date()

    await this.store.saveState(this.state)
    this.emit("paused", this.state)
  }

  async resume(): Promise<void> {
    if (this.state.status !== AgentStatus.PAUSED) {
      throw new Error("Agent is not paused")
    }

    this.logger.info("Resuming agent", { agentId: this.config.id })
    this.state.status = AgentStatus.RUNNING
    this.state.updatedAt = new Date()

    await this.store.saveState(this.state)
    this.emit("resumed", this.state)

    this.processTaskQueue()
  }

  async addTask(task: Omit<Task, "id" | "status" | "retryCount">): Promise<string> {
    const fullTask: Task = {
      ...task,
      id: this.generateTaskId(),
      status: TaskStatus.PENDING,
      retryCount: 0,
      maxRetries: task.maxRetries || this.config.retryAttempts,
    }

    await this.jobQueue.add(fullTask)
    this.logger.info("Task added to queue", { taskId: fullTask.id, type: fullTask.type })

    return fullTask.id
  }

  getState(): AgentState {
    return { ...this.state }
  }

  async getMetrics(): Promise<AgentMetrics> {
    const totalTasks = this.state.completedTasks.length + this.state.failedTasks.length
    const completedTasks = this.state.completedTasks.length
    const failedTasks = this.state.failedTasks.length

    const averageExecutionTime =
      this.state.completedTasks.reduce((acc, task) => {
        if (task.startedAt && task.completedAt) {
          return acc + (task.completedAt.getTime() - task.startedAt.getTime())
        }
        return acc
      }, 0) / Math.max(completedTasks, 1)

    const tokensUsed = this.state.completedTasks.reduce((acc, task) => {
      return acc + (task.result?.metrics?.tokensUsed || 0)
    }, 0)

    const apiCalls = this.state.completedTasks.reduce((acc, task) => {
      return acc + (task.result?.metrics?.apiCalls || 0)
    }, 0)

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      averageExecutionTime,
      successRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
      tokensUsed,
      apiCalls,
      uptime: Date.now() - this.state.createdAt.getTime(),
    }
  }

  private async processTaskQueue(): Promise<void> {
    while (!this.shutdownSignal && this.state.status === AgentStatus.RUNNING) {
      try {
        // Check if we can process more tasks
        if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
          await this.sleep(1000)
          continue
        }

        // Get next task from queue
        const task = await this.jobQueue.getNext()
        if (!task) {
          await this.sleep(1000)
          continue
        }

        // Process task
        const taskPromise = this.processTask(task)
        this.runningTasks.set(task.id, taskPromise)

        // Clean up completed tasks
        taskPromise.finally(() => {
          this.runningTasks.delete(task.id)
        })
      } catch (error) {
        this.logger.error("Error in task queue processing", error)
        await this.sleep(5000) // Back off on error
      }
    }
  }

  private async processTask(task: Task): Promise<void> {
    const startTime = Date.now()

    try {
      this.logger.info("Processing task", { taskId: task.id, type: task.type })

      task.status = TaskStatus.RUNNING
      task.startedAt = new Date()
      this.state.currentTask = task
      this.state.updatedAt = new Date()

      await this.store.saveState(this.state)
      this.emit("taskStarted", task)

      // Get skill for task type
      const skill = this.skillRegistry.getSkill(task.type)
      if (!skill) {
        throw new Error(`No skill found for task type: ${task.type}`)
      }

      // Execute skill with timeout
      const result = await this.executeWithTimeout(skill.execute(task.payload), this.config.timeoutMs)

      // Task completed successfully
      task.status = TaskStatus.COMPLETED
      task.completedAt = new Date()
      task.result = {
        success: true,
        data: result.data,
        metrics: {
          executionTimeMs: Date.now() - startTime,
          tokensUsed: result.metadata?.tokensUsed || 0,
          apiCalls: result.metadata?.apiCalls || 0,
        },
        artifacts: result.metadata?.artifacts,
      }

      this.state.completedTasks.push(task)
      this.logger.info("Task completed successfully", { taskId: task.id })
    } catch (error) {
      this.logger.error("Task failed", error)
      task.status = TaskStatus.FAILED
      task.completedAt = new Date()
      task.result = {
        success: false,
        error: error.message,
      }
      this.state.failedTasks.push(task)
      this.logger.error("Task failed", { taskId: task.id, error: error.message })
    }
  }

  private generateTaskId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private async executeWithTimeout(promise: Promise<any>, timeoutMs: number): Promise<any> {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Task execution timed out")), timeoutMs)),
    ])
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
