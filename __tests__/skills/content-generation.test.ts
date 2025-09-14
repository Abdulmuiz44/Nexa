import { ContentGenerationSkill } from "@/src/agent/skills/content-generation"
import { LLMWrapper } from "@/src/agent/llm/wrapper"
import jest from "jest" // Declare the jest variable

// Mock the LLM wrapper
jest.mock("@/src/agent/llm/wrapper")

describe("ContentGenerationSkill", () => {
  let skill: ContentGenerationSkill
  let mockLLM: jest.Mocked<LLMWrapper>

  beforeEach(() => {
    mockLLM = new LLMWrapper({
      provider: "openai",
      model: "gpt-4",
      apiKey: "test-key",
    }) as jest.Mocked<LLMWrapper>

    skill = new ContentGenerationSkill(mockLLM)
  })

  it("should generate content successfully", async () => {
    const mockResponse = {
      content: "This is a test post about AI technology.",
      metadata: { tokensUsed: 50, apiCalls: 1 },
    }

    mockLLM.generateText.mockResolvedValue(mockResponse)

    const result = await skill.execute({
      topic: "AI Technology",
      targetAudience: "Tech enthusiasts",
      channels: ["twitter"],
    })

    expect(result.data).toHaveProperty("content")
    expect(result.data).toHaveProperty("hashtags")
    expect(result.data).toHaveProperty("channels")
    expect(result.metadata?.tokensUsed).toBe(50)
    expect(result.metadata?.apiCalls).toBe(1)
  })

  it("should handle LLM errors gracefully", async () => {
    mockLLM.generateText.mockRejectedValue(new Error("API rate limit exceeded"))

    await expect(
      skill.execute({
        topic: "AI Technology",
        targetAudience: "Tech enthusiasts",
        channels: ["twitter"],
      }),
    ).rejects.toThrow("API rate limit exceeded")
  })
})
