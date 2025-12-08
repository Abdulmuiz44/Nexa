import type { Skill, SkillResult } from "./registry"
import { TaskType } from "../../types/agent"
import type { LLMWrapper } from "../llm/wrapper"
import type { ConnectorRegistry } from "../../connectors/registry"

export class EmailOutreachSkill implements Skill {
  name = "Email Outreach"
  description = "Generate and send personalized email outreach campaigns"
  type = TaskType.EMAIL_CAMPAIGN

  constructor(
    private llm: LLMWrapper,
    private connectorRegistry: ConnectorRegistry,
  ) {}

  async execute(payload: Record<string, any>): Promise<SkillResult> {
    try {
      const { recipients, subject, template, personalization, dryRun = true } = payload

      if (!recipients || recipients.length === 0) {
        throw new Error("No recipients specified for email outreach")
      }

      const emailConnector = this.connectorRegistry.get("email")
      if (!emailConnector) {
        throw new Error("Email connector not available")
      }

      const results = []

      for (const recipient of recipients) {
        const personalizedContent = await this.generatePersonalizedEmail(template, recipient, personalization)

        const emailResult = await emailConnector.post(
          {
            to: [recipient.email],
            subject: await this.personalizeSubject(subject, recipient),
            text: personalizedContent,
          } as any,
          dryRun,
        )

        results.push({
          recipient: recipient.email,
          success: emailResult.success,
          postId: emailResult.postId,
          error: emailResult.error,
        })
      }

      const successCount = results.filter((r) => r.success).length
      const failureCount = results.length - successCount

      return {
        success: true,
        data: {
          totalSent: results.length,
          successCount,
          failureCount,
          results,
          dryRun,
        },
        metadata: {
          tokensUsed: recipients.length * 100, // Estimate
          apiCalls: recipients.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Email outreach failed",
        metadata: {
          apiCalls: 1,
        },
      }
    }
  }

  private async generatePersonalizedEmail(template: string, recipient: any, personalization: any): Promise<string> {
    const prompt = `
Personalize this email template for the recipient:

Template: ${template}

Recipient Information:
- Name: ${recipient.name || "there"}
- Company: ${recipient.company || "your company"}
- Role: ${recipient.role || "your role"}

Personalization Context: ${JSON.stringify(personalization)}

Generate a personalized, professional email that feels natural and engaging.
`

    const response = await this.llm.generateText({
      model: process.env.MISTRAL_MODEL || "mistral-large-latest",
      messages: [
        {
          role: "system",
          content:
            "You are an expert email copywriter. Create personalized, professional emails that drive engagement.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 500,
      temperature: 0.7,
    })

    return response.content
  }

  private async personalizeSubject(subject: string, recipient: any): Promise<string> {
    if (!subject.includes("{") && !subject.includes("[")) {
      return subject
    }

    // Simple template replacement
    return subject
      .replace(/{name}/g, recipient.name || "there")
      .replace(/{company}/g, recipient.company || "your company")
      .replace(/{role}/g, recipient.role || "your role")
  }
}
