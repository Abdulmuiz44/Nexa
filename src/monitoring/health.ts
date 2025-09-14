export interface HealthCheck {
  name: string
  status: "healthy" | "unhealthy" | "degraded"
  message?: string
  lastChecked: Date
  responseTime?: number
}

export class HealthMonitor {
  private checks = new Map<string, HealthCheck>()

  async runCheck(name: string, checkFn: () => Promise<boolean>): Promise<HealthCheck> {
    const startTime = Date.now()

    try {
      const result = await checkFn()
      const responseTime = Date.now() - startTime

      const check: HealthCheck = {
        name,
        status: result ? "healthy" : "unhealthy",
        lastChecked: new Date(),
        responseTime,
      }

      this.checks.set(name, check)
      return check
    } catch (error) {
      const check: HealthCheck = {
        name,
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      }

      this.checks.set(name, check)
      return check
    }
  }

  getCheck(name: string): HealthCheck | undefined {
    return this.checks.get(name)
  }

  getAllChecks(): HealthCheck[] {
    return Array.from(this.checks.values())
  }

  getOverallStatus(): "healthy" | "unhealthy" | "degraded" {
    const checks = this.getAllChecks()

    if (checks.length === 0) return "healthy"

    const unhealthy = checks.filter((c) => c.status === "unhealthy")
    const degraded = checks.filter((c) => c.status === "degraded")

    if (unhealthy.length > 0) return "unhealthy"
    if (degraded.length > 0) return "degraded"

    return "healthy"
  }
}

export const healthMonitor = new HealthMonitor()
