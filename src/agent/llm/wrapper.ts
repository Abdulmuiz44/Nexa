import type { LLMRequest, LLMResponse } from "../../types/agent"
import type { Logger } from "../utils/logger"
import { MistralClient } from "../../lib/ai/mistral-client"

export class LLMWrapper {
  private client: MistralClient
  private logger: Logger
  private requestCount = 0
  private tokenUsage = { prompt: 0, completion: 0, total: 0 }

  constructor(apiKey: string, logger: Logger) {
    this.client = new MistralClient(apiKey)
    this.logger = logger
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now()
    this.requestCount++

    try {
      this.logger.info("LLM request started", {
        model: request.model,
        messageCount: request.messages.length,
        requestId: this.requestCount,
      })

      const response = await this.client.chat(request.messages as any, {
        model: request.model || "mistral-large-latest",
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      })

      const content = response.message
      if (!content) {
        throw new Error("No content in LLM response")
      }

      const usage = response.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }

      // Update usage tracking
      this.tokenUsage.prompt += usage.prompt_tokens || 0
      this.tokenUsage.completion += usage.completion_tokens || 0
      this.tokenUsage.total += usage.total_tokens || 0

      const executionTime = Date.now() - startTime

      const tokensUsed = usage.total_tokens ?? response.tokensUsed ?? 0

      this.logger.info("LLM request completed", {
        model: response.model || request.model,
        executionTime,
        tokensUsed,
        requestId: this.requestCount,
      })

      return {
        content,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: tokensUsed,
        },
        model: response.model || request.model,
        finishReason: "stop",
      }
    } catch (error) {
      const executionTime = Date.now() - startTime

      this.logger.error("LLM request failed", {
        model: request.model,
        executionTime,
        error: error instanceof Error ? error.message : "Unknown error",
        requestId: this.requestCount,
      })

      throw error
    }
  }

  async generateTextWithRetry(request: LLMRequest, maxRetries = 3, backoffMs = 1000): Promise<LLMResponse> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateText(request)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error")

        if (attempt === maxRetries) {
          break
        }

        const delay = backoffMs * Math.pow(2, attempt - 1) // Exponential backoff
        this.logger.warn(`LLM request failed, retrying in ${delay}ms`, {
          attempt,
          maxRetries,
          error: lastError.message,
        })

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  getUsageStats() {
    return {
      requestCount: this.requestCount,
      tokenUsage: { ...this.tokenUsage },
    }
  }

  resetStats() {
    this.requestCount = 0
    this.tokenUsage = { prompt: 0, completion: 0, total: 0 }
  }
}
