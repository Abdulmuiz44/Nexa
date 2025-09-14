export interface ConnectorConfig {
  name: string
  enabled: boolean
  credentials: Record<string, string>
  rateLimits?: {
    requestsPerMinute: number
    requestsPerHour: number
  }
}

export interface PostContent {
  text: string
  media?: {
    type: "image" | "video"
    url: string
    alt?: string
  }[]
  hashtags?: string[]
  mentions?: string[]
}

export interface PostResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
  metadata?: Record<string, any>
}

export abstract class BaseConnector {
  protected config: ConnectorConfig
  protected lastRequestTime = 0
  protected requestCount = { minute: 0, hour: 0 }

  constructor(config: ConnectorConfig) {
    this.config = config
  }

  abstract authenticate(): Promise<boolean>
  abstract post(content: PostContent, dryRun?: boolean): Promise<PostResult>
  abstract validateContent(content: PostContent): Promise<{ valid: boolean; errors?: string[] }>

  protected async checkRateLimit(): Promise<void> {
    if (!this.config.rateLimits) return

    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    // Reset counters if enough time has passed
    if (timeSinceLastRequest > 60000) {
      this.requestCount.minute = 0
    }
    if (timeSinceLastRequest > 3600000) {
      this.requestCount.hour = 0
    }

    // Check rate limits
    if (this.requestCount.minute >= this.config.rateLimits.requestsPerMinute) {
      const waitTime = 60000 - (timeSinceLastRequest % 60000)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    if (this.requestCount.hour >= this.config.rateLimits.requestsPerHour) {
      const waitTime = 3600000 - (timeSinceLastRequest % 3600000)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.requestCount.minute++
    this.requestCount.hour++
    this.lastRequestTime = now
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  getName(): string {
    return this.config.name
  }
}
