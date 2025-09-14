import { createMocks } from "node-mocks-http"
import { POST } from "@/app/api/agent/start/route"
import { GET } from "@/app/api/agent/[id]/status/route"

describe("/api/agent", () => {
  describe("POST /api/agent/start", () => {
    it("should start an agent with valid payload", async () => {
      const { req } = createMocks({
        method: "POST",
        body: {
          campaignName: "Test Campaign",
          targetAudience: "Tech enthusiasts",
          channels: ["twitter", "linkedin"],
          contentTopics: ["AI", "Technology"],
          schedule: {
            postsPerDay: 3,
            timezone: "UTC",
          },
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.agentId).toBeDefined()
    })

    it("should reject invalid payload", async () => {
      const { req } = createMocks({
        method: "POST",
        body: {
          campaignName: "", // Invalid: empty string
          targetAudience: "Tech enthusiasts",
          channels: ["twitter"],
          contentTopics: ["AI"],
          schedule: {
            postsPerDay: 3,
            timezone: "UTC",
          },
        },
      })

      const response = await POST(req as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe("GET /api/agent/[id]/status", () => {
    it("should return 404 for non-existent agent", async () => {
      const { req } = createMocks({
        method: "GET",
      })

      const response = await GET(req as any, { params: { id: "non-existent" } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})
