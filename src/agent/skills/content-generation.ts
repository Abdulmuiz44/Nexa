import type { Skill, SkillResult } from "./registry"
import { TaskType } from "../../types/agent"
import type { LLMWrapper } from "../llm/wrapper"

export class ContentGenerationSkill implements Skill {
  name = "Content Generation"
  description = "Generate marketing content using AI"
  type = TaskType.CONTENT_GENERATION

  constructor(private llm: LLMWrapper) {}

  async execute(payload: Record<string, any>): Promise<SkillResult> {
    try {
      const { topic, tone, length, targetAudience } = payload

      const prompt = this.buildPrompt(topic, tone, length, targetAudience)

      const response = await this.llm.generateText({
        model: process.env.MISTRAL_MODEL || "mistral-large-latest",
        messages: [
          {
            role: "system",
            content:
              "You are an expert marketing content creator. Generate engaging, high-quality content that drives results.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        maxTokens: this.getMaxTokensForLength(length),
        temperature: 0.7,
      })

      return {
        success: true,
        data: {
          content: response.content,
          wordCount: response.content.split(" ").length,
          topic,
          tone,
          targetAudience,
        },
        metadata: {
          tokensUsed: response.usage.totalTokens,
          apiCalls: 1,
          model: response.model,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        metadata: {
          apiCalls: 1,
        },
      }
    }
  }

  private buildPrompt(topic: string, tone: string, length: string, targetAudience: string): string {
    return `Create ${length} marketing content about "${topic}" with a ${tone} tone for ${targetAudience}.

Requirements:
- Engaging and compelling
- Clear call-to-action
- SEO-friendly
- Platform-appropriate formatting

Topic: ${topic}
Tone: ${tone}
Length: ${length}
Target Audience: ${targetAudience}`
  }

  private getMaxTokensForLength(length: string): number {
    switch (length.toLowerCase()) {
      case "short":
        return 200
      case "medium":
        return 500
      case "long":
        return 1000
      default:
        return 500
    }
  }
}
