export interface AgentConfig {
  id: string
  name: string
  description: string
  skills: string[]
  maxConcurrentTasks: number
  retryAttempts: number
  timeoutMs: number
}

export interface AgentState {
  id: string
  status: AgentStatus
  currentTask?: Task
  completedTasks: Task[]
  failedTasks: Task[]
  createdAt: Date
  updatedAt: Date
  metadata: Record<string, any>
}

export enum AgentStatus {
  IDLE = "idle",
  RUNNING = "running",
  PAUSED = "paused",
  STOPPED = "stopped",
  ERROR = "error",
}

export interface Task {
  id: string
  type: TaskType
  payload: Record<string, any>
  status: TaskStatus
  priority: TaskPriority
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  result?: TaskResult
  error?: string
  retryCount: number
  maxRetries: number
}

export enum TaskType {
  CONTENT_GENERATION = "content_generation",
  SOCIAL_MEDIA_POST = "social_media_post",
  EMAIL_CAMPAIGN = "email_campaign",
  MARKET_RESEARCH = "market_research",
  LEAD_GENERATION = "lead_generation",
  ANALYTICS_REPORT = "analytics_report",
  NEW_TASK_TYPE = "new_task_type", // Added new task type
}

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

export interface TaskResult {
  success: boolean
  data?: any
  metrics?: {
    executionTimeMs: number
    tokensUsed?: number
    apiCalls?: number
  }
  artifacts?: {
    files?: string[]
    urls?: string[]
    content?: string
  }
}

export interface SkillResult {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

export interface LLMRequest {
  model: string
  messages: Array<{
    role: "system" | "user" | "assistant"
    content: string
  }>
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export interface LLMResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason: string
}

export interface AgentMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageExecutionTime: number
  successRate: number
  tokensUsed: number
  apiCalls: number
  uptime: number
}

export interface HumanFeedback {
  taskId: string
  rating: number // 1-5
  comments?: string
  suggestions?: string
  timestamp: Date
}
